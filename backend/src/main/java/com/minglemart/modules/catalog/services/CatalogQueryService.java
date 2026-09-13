package com.minglemart.modules.catalog.services;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minglemart.modules.catalog.models.ProductModel;
import com.minglemart.modules.catalog.models.ProductVariantModel;
import com.minglemart.modules.catalog.models.VariantPriceView;
import com.minglemart.modules.catalog.repositories.ProductImageRepository;
import com.minglemart.modules.catalog.repositories.ProductVariantRepository;
import com.minglemart.shared.common.Money;
import com.minglemart.shared.contracts.CatalogQuery;
import com.minglemart.shared.enums.PriceBy;

/**
 * The catalogue as other modules see it. Cart, order and the chat agent go
 * through this rather than touching the entities, which is what keeps them
 * ignorant of how pricing is modelled.
 */
@Service
@Transactional(readOnly = true)
public class CatalogQueryService implements CatalogQuery {

    private final ProductService products;
    private final ProductVariantRepository variants;
    private final PricingService pricing;
    private final ProductImageRepository images;

    public CatalogQueryService(ProductService products,
                               ProductVariantRepository variants,
                               PricingService pricing,
                               ProductImageRepository images) {
        this.products = products;
        this.variants = variants;
        this.pricing = pricing;
        this.images = images;
    }

    /**
     * The price carried here is the EFFECTIVE price — what the shopper would be
     * charged now, offers included. The cart snapshots this at add time, so a
     * campaign ending later never silently reprices an open basket.
     */
    @Override
    public Optional<VariantSummary> findVariant(UUID variantId) {
        return variants.findById(variantId).map(this::toSummary);
    }

    @Override
    public List<ProductSummary> search(String query, int limit) {
        List<ProductModel> found = products.search(query, limit);
        if (found.isEmpty()) {
            return List.of();
        }

        // One query for every default variant rather than one per product.
        Map<UUID, UUID> defaults = variants
                .findByProductIdInAndDefaultVariantTrue(found.stream().map(ProductModel::getId).toList())
                .stream()
                .collect(Collectors.toMap(
                        variant -> variant.getProduct().getId(),
                        ProductVariantModel::getId));

        return found.stream()
                .map(product -> new ProductSummary(
                        product.getId(),
                        product.getSlug(),
                        product.getName(),
                        product.getBrand(),
                        defaults.get(product.getId())))
                .toList();
    }

    private VariantSummary toSummary(ProductVariantModel variant) {
        Money price = pricing.priceOf(variant.getId())
                .map(VariantPriceView::effectivePrice)
                .orElseGet(variant::listPrice);

        return new VariantSummary(
                variant.getId(),
                variant.getProduct().getId(),
                variant.getSku(),
                variant.getName(),
                variant.getProduct().getName(),
                price,
                variant.getProduct().getTaxRate(),
                variant.getProduct().getStorageType(),
                imageOf(variant),
                variant.isActive(),
                weighingOf(variant));
    }

    /**
     * Null for anything counted and priced by the piece — which is most of the
     * shop, and is why callers can treat the absence as "a quantity is just a
     * number" without checking two enums to find out.
     *
     * <p>The nominal weight is converted out of {@code weight_grams} here so
     * nobody downstream has to know the catalogue stores grams while the price
     * is quoted per pound.
     */
    private CatalogQuery.Weighing weighingOf(ProductVariantModel variant) {
        if (variant.getPriceBy() != PriceBy.WEIGHT) {
            return null;
        }

        BigDecimal nominal = variant.getWeightGrams() == null
                ? null
                : variant.getPriceUnit().fromGrams(variant.getWeightGrams());

        return new CatalogQuery.Weighing(
                variant.getSellBy(),
                variant.getPriceBy(),
                variant.getPriceUnit(),
                nominal,
                variant.getMinWeight(),
                variant.getMaxWeight(),
                variant.getPickTolerancePct());
    }

    /**
     * The picture to show for this variant, or null when it has none.
     *
     * The repository does the precedence in one ordered query; this only takes
     * the winner.
     */
    private String imageOf(ProductVariantModel variant) {
        return images.findLeadImageUrls(variant.getProduct().getId(), variant.getId())
                .stream()
                .findFirst()
                .orElse(null);
    }
}
