package com.minglemart.shared.contracts;



import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.minglemart.shared.common.Money;
import com.minglemart.shared.enums.PriceBy;
import com.minglemart.shared.enums.SellBy;
import com.minglemart.shared.enums.PriceUnit;
import com.minglemart.shared.enums.StorageType;

public interface CatalogQuery {
    Optional<VariantSummary> findVariant(UUID variantId);
    List<ProductSummary> search(String query, int limit);

    record ProductSummary(
        UUID id,
        String slug,
        String name,
        String brand,
        UUID defaultVariantId
    ) {}

    record VariantSummary(
        UUID id,
        UUID productId,
        String sku,
        String name,
        String productName,
        Money price,
        BigDecimal taxRate,
        /** Decides whether an abandoned pick of this goes back on the shelf or in the bin. */
        StorageType storageType,
        String imageUrl,
        boolean active,
        Weighing weighing
    ) {
        public Money estimate(BigDecimal quantity) {
            return price.times(weighing == null ? quantity : weighing.expectedUnits(quantity));
        }

        public Money ceiling(BigDecimal quantity) {
            return price.times(weighing == null ? quantity : weighing.maxUnits(quantity));
        }

        public boolean weighed() {
            return weighing != null;
        }
    }

    record Weighing(
        SellBy sellBy,
        PriceBy priceBy,
        PriceUnit priceUnit,
        BigDecimal nominalWeight,
        BigDecimal minWeight,
        BigDecimal maxWeight,
        BigDecimal pickTolerancePct
    ) {
        private static final BigDecimal HUNDRED = new BigDecimal("100");


        public BigDecimal expectedUnits(BigDecimal quantity) {
            return sellBy == SellBy.EACH ? nominalWeight.multiply(quantity) : quantity;
        }

        public BigDecimal minUnits(BigDecimal quantity) {
            return sellBy == SellBy.EACH ? minWeight.multiply(quantity) : quantity.multiply(BigDecimal.ONE.subtract(pickTolerancePct.divide(HUNDRED)));
        }

        public BigDecimal maxUnits(BigDecimal quantity) {
            return sellBy == SellBy.EACH ? maxWeight.multiply(quantity) : quantity.multiply(BigDecimal.ONE.add(pickTolerancePct.divide(HUNDRED)));
        }
    }
}
