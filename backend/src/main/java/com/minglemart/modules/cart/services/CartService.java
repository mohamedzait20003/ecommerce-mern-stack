package com.minglemart.modules.cart.services;

import java.util.List;
import java.util.UUID;
import java.util.Optional;
import java.util.ArrayList;
import java.math.BigDecimal;
import java.util.Comparator;
import org.springframework.stereotype.Service;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.transaction.annotation.Transactional;

import com.minglemart.shared.common.Money;
import com.minglemart.shared.common.ActorRef;
import com.minglemart.shared.enums.CartStatus;
import com.minglemart.shared.enums.PriceUnit;
import com.minglemart.shared.infra.RedisStore;
import com.minglemart.modules.cart.models.CartModel;
import com.minglemart.shared.contracts.CatalogQuery;
import com.minglemart.shared.domain.BaseDataService;
import com.minglemart.modules.cart.dtos.CartResponse;
import com.minglemart.shared.contracts.CartOperations;
import com.minglemart.modules.cart.config.CartCacheKeys;
import com.minglemart.modules.cart.models.CartItemModel;
import com.minglemart.modules.cart.repositories.CartRepository;
import com.minglemart.modules.cart.repositories.CartItemRepository;

@Service
public class CartService extends BaseDataService<CartModel, CartRepository> implements CartOperations {
    private static final BigDecimal MAX_QUANTITY = new BigDecimal("99");

    private final CartItemRepository items;
    private final CatalogQuery catalog;
    private final RedisStore cache;

    public CartService(CartRepository repository, CartItemRepository items, CatalogQuery catalog,  RedisStore cache) {
        super(repository);
        this.items = items;
        this.catalog = catalog;
        this.cache = cache;
    }

    @Override
    protected String entityName() {
        return "Cart";
    }

    // --- reads ---

    public CartResponse viewFor(UUID userId) {
        String key = CartCacheKeys.forUser(userId);

        Optional<CartResponse> cached = cache.get(key, CartResponse.class);
        if (cached.isPresent()) {
            return cached.get();
        }

        CartResponse fresh = render(activeCart(userId));
        cache.set(key, fresh, CartCacheKeys.CART_TTL);
        return fresh;
    }

    @Override
    public CartSummary currentCart(UUID userId) {
        return summarise(activeCart(userId));
    }

    // --- writes ---

    @Override
    @Transactional
    public CartSummary addItem(UUID userId, UUID variantId, BigDecimal quantity, ActorRef actor) {
        requirePositive(quantity);

        CatalogQuery.VariantSummary variant = requirePurchasable(variantId);
        CartModel cart = findOrCreate(userId, variant.price().currency());

        items.findByCartIdAndVariantId(cart.getId(), variantId).ifPresentOrElse(line -> line.setQuantity(cap(line.getQuantity().add(quantity))), () -> cart.addItem(newLine(cart, variant, quantity, actor)));

        return settle(cart, userId);
    }

    /** Zero removes the line, so a stepper clicked to nothing needs no special case. */
    @Override
    @Transactional
    public CartSummary updateQuantity(UUID userId, UUID variantId, BigDecimal quantity, ActorRef actor) {
        if (quantity == null || quantity.signum() <= 0) {
            return removeItem(userId, variantId, actor);
        }

        CartModel cart = requireActiveCart(userId);
        CartItemModel line = items.findByCartIdAndVariantId(cart.getId(), variantId).orElseThrow(() -> new EntityNotFoundException("That item is not in your cart."));

        line.setQuantity(cap(quantity));
        line.setActorType(actor.type());

        return settle(cart, userId);
    }

    @Override
    @Transactional
    public CartSummary removeItem(UUID userId, UUID variantId, ActorRef actor) {
        CartModel cart = requireActiveCart(userId);

        items.findByCartIdAndVariantId(cart.getId(), variantId).ifPresent(cart::removeItem);

        return settle(cart, userId);
    }

    @Transactional
    public CartSummary clear(UUID userId) {
        CartModel cart = requireActiveCart(userId);
        cart.getItems().clear();

        return settle(cart, userId);
    }

    // --- internals ---
    private CartSummary settle(CartModel cart, UUID userId) {
        CartModel saved = repository.save(cart);
        cache.evict(CartCacheKeys.forUser(userId));

        return summarise(Optional.of(saved));
    }

    private Optional<CartModel> activeCart(UUID userId) {
        return repository.findWithItems(userId, CartStatus.ACTIVE);
    }

    private CartModel requireActiveCart(UUID userId) {
        return activeCart(userId).orElseThrow(() -> new EntityNotFoundException("Your cart is empty."));
    }

    private CartModel findOrCreate(UUID userId, String currency) {
        return repository.findByUserIdAndStatus(userId, CartStatus.ACTIVE).orElseGet(() -> {
            try {
                return repository.save(CartModel.builder()
                    .userId(userId)
                    .currency(currency)
                    .status(CartStatus.ACTIVE)
                    .build()
                );
            } catch (DataIntegrityViolationException lostTheRace) {
                return repository.findByUserIdAndStatus(userId, CartStatus.ACTIVE).orElseThrow(() -> lostTheRace);
            }
        });
    }

    private CartItemModel newLine(CartModel cart, CatalogQuery.VariantSummary variant, BigDecimal quantity, ActorRef actor) {
        return CartItemModel.builder().cart(cart)
            .variantId(variant.id())
            .quantity(cap(quantity))
            .unitPriceAmount(variant.price().amount())
            .currency(variant.price().currency())
            .actorType(actor.type())
            .build();
    }

    private CatalogQuery.VariantSummary requirePurchasable(UUID variantId) {
        CatalogQuery.VariantSummary variant = catalog.findVariant(variantId).orElseThrow(() -> new EntityNotFoundException("That product is no longer available."));

        if (!variant.active()) {
            throw new IllegalStateException("That product is no longer available.");
        }
        return variant;
    }

    /** The contract's view: what a line costs, without the UI's drift fields. */
    private CartSummary summarise(Optional<CartModel> cart) {
        CartResponse view = render(cart);

        List<CartLine> lines = view.lines().stream().map(line -> new CartLine(
            line.variantId(),
            line.sku(),
            line.name(),
            line.quantity(),
            line.quantityUnit(),
            line.unitPrice(),
            line.lineTotal())
        ).toList();

        return new CartSummary(view.cartId(), lines, view.subtotal());
    }

    private CartResponse render(Optional<CartModel> maybeCart) {
        if (maybeCart.isEmpty()) {
            return CartResponse.empty(null, "USD");
        }

        CartModel cart = maybeCart.get();
        if (cart.getItems().isEmpty()) {
            return CartResponse.empty(cart.getId(), cart.getCurrency());
        }

        List<CartResponse.Line> lines = new ArrayList<>();
        Money subtotal = Money.zero(cart.getCurrency());

        int count = 0;
        boolean drift = false;
        List<CartItemModel> ordered = cart.getItems().stream().sorted(Comparator.comparing(CartItemModel::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder()))).toList();

        for (CartItemModel item : ordered) {
            Optional<CatalogQuery.VariantSummary> variant = catalog.findVariant(item.getVariantId());
            BigDecimal quantity = item.getQuantity();

            // A delisted variant still has to render. Falling back to the
            // snapshot price times quantity is exact for anything counted by
            // the piece, and the best available guess for anything weighed.
            Money lineTotal = variant.map(v -> v.estimate(quantity)).orElseGet(() -> item.unitPrice().times(quantity));

            boolean weighed = variant.map(CatalogQuery.VariantSummary::weighed).orElse(false);
            PriceUnit unit = weighed ? variant.get().weighing().priceUnit() : null;

            CartResponse.Line line = new CartResponse.Line(
                item.getVariantId(),
                variant.map(CatalogQuery.VariantSummary::sku).orElse(null),
                variant.map(CatalogQuery.VariantSummary::name).orElse("Unavailable item"),
                variant.map(CatalogQuery.VariantSummary::imageUrl).orElse(null),
                quantity,
                unit,
                item.unitPrice(),
                variant.map(CatalogQuery.VariantSummary::price).orElse(null),
                lineTotal,
                variant.map(v -> v.ceiling(quantity)).orElse(lineTotal),
                weighed,
                variant.map(v -> !v.active()).orElse(true)
            );

            lines.add(line);
            subtotal = subtotal.plus(lineTotal);
            // However much ham there is, it is one thing in the basket.
            count += weighed ? 1 : quantity.intValue();
            drift |= line.priceChanged();
        }

        return new CartResponse(cart.getId(), lines, count, subtotal, drift);
    }

    private static BigDecimal cap(BigDecimal quantity) {
        return quantity.min(MAX_QUANTITY);
    }

    private static void requirePositive(BigDecimal quantity) {
        if (quantity == null || quantity.signum() <= 0) {
            throw new IllegalArgumentException("Quantity must be more than zero.");
        }
    }
}
