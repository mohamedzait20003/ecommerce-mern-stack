package com.minglemart.modules.order.services;

import java.util.UUID;
import java.util.List;
import java.util.Map;
import java.time.Instant;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.stream.Collectors;
import java.math.BigDecimal;
import java.math.RoundingMode;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.transaction.annotation.Transactional;



import com.minglemart.modules.order.models.OrderItemModel;
import com.minglemart.modules.order.models.OrderModel;
import com.minglemart.modules.order.models.OrderStatusHistoryModel;
import com.minglemart.modules.order.repositories.OrderRepository;
import com.minglemart.modules.order.repositories.OrderStatusHistoryRepository;
import com.minglemart.shared.common.ActorRef;
import com.minglemart.shared.common.Money;
import com.minglemart.shared.contracts.CartOperations;
import com.minglemart.shared.contracts.CatalogQuery;
import com.minglemart.shared.contracts.OrderOperations;
import com.minglemart.shared.domain.BaseDataService;
import com.minglemart.shared.enums.OrderStatus;
import com.minglemart.shared.enums.PickOutcome;
import com.minglemart.shared.events.OrderAuthorised;
import com.minglemart.shared.events.OrderCancelled;
import com.minglemart.shared.events.OrderPlaced;
import com.minglemart.shared.events.OrderStatusChanged;

/**
 * Turning a basket into a promise.
 *
 * <p>Placement computes two totals, not one. The estimate is what the shopper
 * agreed to; the ceiling is the most the order could possibly come to once
 * every weighed line has been on a scale, and it is what the card gets held
 * for. The gap between them is the headroom, and it is derived per line rather
 * than guessed as a percentage — a basket of tins produces no gap at all.
 *
 * <p>Nothing here talks to a payment provider. This writes the order at
 * {@link OrderStatus#PLACED} with the figure to authorise on it; the payment
 * module puts the hold on and moves it to {@link OrderStatus#AUTHORIZED}.
 */
@Service
public class OrderService extends BaseDataService<OrderModel, OrderRepository> implements OrderOperations {
    private static final BigDecimal HUNDRED = new BigDecimal("100");
    
    private static final String NO_SUCH_ORDER = "No such order.";

    
    private final CartOperations carts;
    private final CatalogQuery catalog;
    private final OrderNumbers numbers;
    private final DeliverySlots slots;
    private final ApplicationEventPublisher events;
    private final OrderStatusHistoryRepository history;
    public OrderService(
        OrderRepository repository,
        OrderStatusHistoryRepository history,
        CartOperations carts,
        CatalogQuery catalog,
        OrderNumbers numbers,
        DeliverySlots slots,
        ApplicationEventPublisher events
    ) {
        super(repository);
        this.history = history;
        this.carts = carts;
        this.catalog = catalog;
        this.numbers = numbers;
        this.slots = slots;
        this.events = events;
    }

    @Override
    protected String entityName() {
        return "Order";
    }

    // --- reads ---

    @Override
    public Optional<OrderSummary> findById(UUID orderId) {
        return repository.findById(orderId).map(OrderService::summarise);
    }

    @Override
    public Optional<OrderSummary> findByNumber(String orderNumber) {
        return repository.findByOrderNumber(orderNumber).map(OrderService::summarise);
    }

    /**
     * The order, but only if it is this customer's. Used wherever a URL carries
     * an order number: those are handed out by name and read back over the
     * phone, so ownership is checked here rather than assumed from possession.
     */
    public Optional<OrderModel> ownedOrder(String orderNumber, UUID userId) {
        return repository.findByOrderNumber(orderNumber)
                .filter(order -> order.getUserId().equals(userId));
    }

    /** The same, with lines loaded, for rendering the order itself. */
    public Optional<OrderModel> ownedOrderWithItems(String orderNumber, UUID userId) {
        return ownedOrder(orderNumber, userId)
                .flatMap(order -> repository.findWithItems(order.getId()));
    }

    @Override
    public Optional<OrderSummary> findOwned(String orderNumber, UUID userId) {
        return ownedOrder(orderNumber, userId).map(OrderService::summarise);
    }

    public Page<OrderModel> ownedOrders(UUID userId, Pageable page) {
        return repository.findByUserIdOrderByCreatedAtDesc(userId, page);
    }

    /**
     * Moves a PLACED order to AUTHORIZED, and only a PLACED one.
     *
     * <p>Two things can say the hold went on: the checkout request, when the
     * authorise call succeeds inline, and the provider's webhook, which is the
     * only voice on the 3-D Secure path and a late echo on the other. This is
     * the guard that lets both speak without either walking an order that has
     * since moved on back to AUTHORIZED.
     */
    @Transactional
    public void authoriseIfPlaced(UUID orderId, ActorRef actor) {
        repository.findById(orderId)
                .filter(order -> order.getStatus() == OrderStatus.PLACED)
                .ifPresent(order -> transition(orderId, OrderStatus.AUTHORIZED, "Card authorised.", actor));
    }

    @Override
    public List<OrderSummary> findStaleHolds(Instant olderThan) {
        return repository.findStale(
                        List.of(OrderStatus.AUTHORIZED, OrderStatus.PROCESSING), olderThan)
                .stream()
                .map(OrderService::summarise)
                .toList();
    }

    public List<OrderStatusHistoryModel> trail(UUID orderId) {
        return history.findByOrderIdOrderByCreatedAt(orderId);
    }

    // --- placement ---

    @Override
    @Transactional
    public OrderSummary place(PlaceOrder command) {
        // A retried tool call finds the order it already made rather than
        // making a second one. The UNIQUE index is the real guard; this only
        // saves the caller an error they would have to interpret.
        if (command.idempotencyKey() != null) {
            Optional<OrderModel> already = repository.findByIdempotencyKey(command.idempotencyKey());
            if (already.isPresent()) {
                return summarise(already.get());
            }
        }

        CartOperations.CartSummary cart = carts.currentCart(command.userId());
        if (cart.lines().isEmpty()) {
            throw new IllegalStateException("Your cart is empty.");
        }

        Instant placedAt = Instant.now();
        slots.validate(command.deliverySpeed(), command.deliveryWindowStart(), placedAt);

        String currency = cart.total().currency();
        OrderModel order = OrderModel.builder()
                .orderNumber(numbers.next(repository::existsByOrderNumber))
                .userId(command.userId())
                .cartId(cart.cartId())
                .billingAccountId(command.billingAccountId())
                .status(OrderStatus.PLACED)
                .currency(currency)
                .actorType(command.actor().type())
                .idempotencyKey(command.idempotencyKey())
                .deliverySpeed(command.deliverySpeed())
                .deliveryWindowStart(command.deliveryWindowStart())
                .deliveryWindowEnd(slots.endFor(command.deliveryWindowStart()))
                .deliveryAddressId(command.deliveryAddressId())
                .customerNote(command.customerNote())
                .placedAt(placedAt)
                .build();

        Money estimate = Money.zero(currency);
        Money ceiling = Money.zero(currency);
        Money estimatedTax = Money.zero(currency);
        Money ceilingTax = Money.zero(currency);

        for (CartOperations.CartLine line : cart.lines()) {
            CatalogQuery.VariantSummary variant = catalog.findVariant(line.variantId())
                .orElseThrow(() -> new IllegalStateException("%s is no longer available.".formatted(line.name())));

            OrderItemModel item = lineFrom(line, variant, currency);
            order.addItem(item);

            Money lineTotal = new Money(item.getTotalAmount(), currency);
            Money lineCeiling = item.ceiling();

            estimate = estimate.plus(lineTotal);
            ceiling = ceiling.plus(lineCeiling);
            estimatedTax = estimatedTax.plus(new Money(item.getTaxAmount(), currency));
            ceilingTax = ceilingTax.plus(taxOn(lineCeiling, item.getTaxRate()));
        }

        // The fee is decided here, from the estimate, and never recalculated —
        // a basket that earned free delivery keeps it however the pick goes.
        BigDecimal shipping = command.deliverySpeed().feeFor(estimate.amount());

        order.setSubtotalAmount(estimate.amount());
        order.setTaxAmount(estimatedTax.amount());
        order.setShippingAmount(shipping);
        order.setTotalAmount(estimate.amount().add(estimatedTax.amount()).add(shipping));

        // Same arithmetic against the ceilings. Identical to the total whenever
        // nothing in the basket has to be weighed.
        order.setAuthorizedAmount(ceiling.amount().add(ceilingTax.amount()).add(shipping));

        OrderModel saved = repository.save(order);
        recordStatusChange(saved, null, OrderStatus.PLACED, "Order placed.", command.actor());

        // Published inside the transaction that created the order, so the
        // outbox cannot announce an order that failed to save.
        events.publishEvent(new OrderPlaced(
                saved.getId(),
                saved.getOrderNumber(),
                saved.getUserId(),
                saved.getTotalAmount(),
                saved.getAuthorizedAmount(),
                saved.getCurrency()
            )
        );

        return summarise(saved);
    }

    @Override
    public List<OrderLine> linesOf(UUID orderId) {
        return repository.findWithItems(orderId).orElseThrow(() -> new EntityNotFoundException(NO_SUCH_ORDER)).getItems().stream().map(item -> new OrderLine(
            item.getId(),
            item.getVariantId(),
            item.getSku(),
            item.getProductName(),
            item.getVariantName(),
            item.getQuantity(),
            item.getSellBy(),
            item.getPriceBy(),
            item.getPriceUnit(),
            item.getMinWeight(),
            item.getMaxWeight()
        )).toList();
    }

    // --- what the picker found becomes what is charged ---
    @Override
    @Transactional
    public OrderSummary settlePick(SettlePick command) {
        OrderModel order = repository.findWithItems(command.orderId()).orElseThrow(() -> new EntityNotFoundException(NO_SUCH_ORDER));

        Map<UUID, PickedLine> found = command.lines().stream().collect(Collectors.toMap(PickedLine::orderItemId, line -> line));

        String currency = order.getCurrency();
        Money goods = Money.zero(currency);
        Money tax = Money.zero(currency);

        for (OrderItemModel item : order.getItems()) {
            PickedLine picked = found.get(item.getId());
            if (picked == null || picked.outcome() == PickOutcome.UNAVAILABLE) {
                continue;
            }

            Money lineAmount = bill(item, picked);
            goods = goods.plus(lineAmount);
            tax = tax.plus(taxOn(lineAmount, item.getTaxRate()));
        }

        // Nothing at all could be found. There is no delivery to charge for
        // either, so the order simply ends and the hold is released.
        if (goods.amount().signum() == 0) {
            return summarise(transition(order.getId(), OrderStatus.CANCELLED, "Nothing in this order could be found.", command.actor()));
        }

        order.setFinalAmount(goods.amount().add(tax.amount()).add(order.getShippingAmount()));

        return summarise(transition(order.getId(), OrderStatus.AWAITING_PAYMENT, "Picked and priced.", command.actor()));
    }

    private static Money bill(OrderItemModel item, PickedLine picked) {
        BigDecimal units = picked.weightPicked() != null ? picked.weightPicked() : picked.quantityPicked();

        if (item.weighed() && item.getMaxWeight() != null && units.compareTo(item.getMaxWeight()) > 0) {
            units = item.getMaxWeight();
        }

        BigDecimal unitPrice = item.getUnitPriceAmount();
        if (picked.substituteUnitPrice() != null) {
            // Never more than the line it replaced.
            unitPrice = unitPrice.min(picked.substituteUnitPrice());
        }

        Money amount = new Money(unitPrice, item.getCurrency()).times(units);

        if (picked.substituteUnitPrice() != null) {
            // Never more than the line it replaced.
            Money original = new Money(item.getTotalAmount(), item.getCurrency());
            
            if (amount.isMoreThan(original)) {
                return original;
            }
        }

        return amount;
    }

    // --- transitions ---

    /**
     * Moves an order and writes the row that says why. Every status change goes
     * through here, which is what makes {@code order_status_history} a complete
     * account of the order rather than a partial one — and it is the feed the
     * customer's live tracking is rendered from.
     */
    @Transactional
    public OrderModel transition(UUID orderId, OrderStatus to, String reason, ActorRef actor) {
        OrderModel order = repository.findById(orderId).orElseThrow(() -> new EntityNotFoundException(NO_SUCH_ORDER));

        OrderStatus from = order.getStatus();
        if (from == to) {
            return order;
        }

        if (from.terminal()) {
            throw new IllegalStateException(
                    "This order is already %s and cannot be moved.".formatted(from));
        }

        order.setStatus(to);
        if (to == OrderStatus.CANCELLED) {
            order.setCancelledAt(Instant.now());
        }

        OrderModel saved = repository.save(order);
        recordStatusChange(saved, from, to, reason, actor);

        // Two transitions have consequences elsewhere. The hold going on is
        // what puts the order on the moderator's board; the order being called
        // off is what releases that hold and, if a picker already had it, puts
        // the goods back. Both are announced rather than done from here.
        if (to == OrderStatus.AUTHORIZED) {
            events.publishEvent(new OrderAuthorised(
                    saved.getId(), saved.getOrderNumber(), saved.getUserId(),
                    saved.getAuthorizedAmount(), saved.getCurrency()));
        } else if (to == OrderStatus.CANCELLED) {
            events.publishEvent(new OrderCancelled(
                    saved.getId(), saved.getOrderNumber(), saved.getUserId(), from, reason));
        }

        return saved;
    }

    @Override
    @Transactional
    public void cancel(UUID orderId, String reason, ActorRef actor) {
        OrderModel order = repository.findById(orderId).orElseThrow(() -> new EntityNotFoundException(NO_SUCH_ORDER));

        // Cheap while it is only a hold: voiding an authorisation costs nothing
        // and refunds nobody. Once a picker is walking the aisles it stops
        // being the shopper's call, because the labour has been spent.
        if (!order.getStatus().cancellableByCustomer()) {
            throw new IllegalStateException("This order is already being prepared and can no longer be cancelled here.");
        }

        transition(orderId, OrderStatus.CANCELLED, reason, actor);
    }

    // --- internals ---

    private OrderItemModel lineFrom(
        CartOperations.CartLine line,
        CatalogQuery.VariantSummary variant,
        String currency
    ) {
        BigDecimal quantity = line.quantity();
        Money unitPrice = line.unitPrice();

        // The cart's snapshotted price, not today's. Drift between adding to
        // the basket and placing the order is ours to absorb.
        Money lineTotal = unitPrice.times(
                variant.weighed() ? variant.weighing().expectedUnits(quantity) : quantity);

        OrderItemModel item = OrderItemModel.builder()
                .variantId(variant.id())
                .sku(variant.sku())
                .productName(variant.productName())
                .variantName(variant.name())
                .quantity(quantity)
                .unitPriceAmount(unitPrice.amount())
                .totalAmount(lineTotal.amount())
                .currency(currency)
                .taxRate(variant.taxRate())
                .taxAmount(taxOn(lineTotal, variant.taxRate()).amount())
                .build();

        if (variant.weighed()) {
            CatalogQuery.Weighing weighing = variant.weighing();
            
            item.setSellBy(weighing.sellBy());
            item.setPriceBy(weighing.priceBy());
            item.setPriceUnit(weighing.priceUnit());
            item.setMinWeight(weighing.minUnits(quantity));
            item.setMaxWeight(weighing.maxUnits(quantity));
        }

        return item;
    }

    private static Money taxOn(Money amount, BigDecimal ratePercent) {
        if (ratePercent == null || ratePercent.signum() == 0) {
            return Money.zero(amount.currency());
        }

        return new Money(
            amount.amount().multiply(ratePercent).divide(HUNDRED, 4, RoundingMode.HALF_UP),
            amount.currency()
        );
    }

    private void recordStatusChange(
        OrderModel order,
        OrderStatus from,
        OrderStatus to,
        String reason,
        ActorRef actor
    ) {
        ActorRef who = actor == null ? ActorRef.SYSTEM : actor;

        OrderStatusHistoryModel row = history.save(OrderStatusHistoryModel.builder()
            .orderId(order.getId())
            .fromStatus(from)
            .toStatus(to)
            .reason(reason)
            .actorType(who.type())
            .actorUserId(who.userId())
            .build());

        // One publish for every move, from the one place every move goes
        // through — which is what keeps the customer's live tracking honest
        // rather than a second, drifting account of the same thing.
        events.publishEvent(new OrderStatusChanged(
            order.getId(),
            order.getOrderNumber(),
            order.getUserId(),
            from,
            to,
            reason,
            row.getCreatedAt() == null ? Instant.now() : row.getCreatedAt()
        ));
    }

    private static OrderSummary summarise(OrderModel order) {
        return new OrderSummary(
            order.getId(),
            order.getOrderNumber(),
            order.getUserId(),
            order.getStatus(),
            order.total(),
            order.hold()
        );
    }
}
