package com.minglemart.shared.enums;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * The unit a weight-priced variant quotes its price in. Mirrors the CHECK
 * constraint on {@code product_variants.price_unit}.
 */
public enum PriceUnit {
    LB("453.59237"),
    KG("1000"),
    OZ("28.349523125"),
    G("1");

    private final BigDecimal gramsPerUnit;

    PriceUnit(String gramsPerUnit) {
        this.gramsPerUnit = new BigDecimal(gramsPerUnit);
    }

    /**
     * A nominal weight in grams, expressed in this unit. This is how a
     * catch-weight line gets an estimate before anything reaches a scale: the
     * variant records what one unit typically weighs, and checkout prices
     * against that while authorising against the top of the band.
     *
     * <p>Three decimals, matching the {@code numeric(12,3)} every weight column
     * in the schema uses.
     */
    public BigDecimal fromGrams(int grams) {
        return BigDecimal.valueOf(grams).divide(gramsPerUnit, 3, RoundingMode.HALF_UP);
    }
}
