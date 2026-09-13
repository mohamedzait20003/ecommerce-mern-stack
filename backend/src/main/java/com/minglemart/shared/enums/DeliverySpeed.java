package com.minglemart.shared.enums;

import java.math.BigDecimal;
import java.time.Duration;

/**
 * What the shopper chose, and therefore what the fee bought. Mirrors the CHECK
 * constraint on {@code orders.delivery_speed}.
 */
public enum DeliverySpeed {
    /** A two-hour window, booked at least three hours out, never past 22:00. */
    STANDARD,
    /** As soon as a driver is free, and so carrying no window at all. */
    EXPRESS;

    /** Every standard window is exactly this wide; the schema enforces it. */
    public static final Duration WINDOW = Duration.ofHours(2);

    /** The soonest a standard window may start, measured from placement. */
    public static final Duration LEAD_TIME = Duration.ofHours(3);

    /** The first window of the day may start at this hour, in the store's own timezone. */
    public static final int FIRST_HOUR = 8;

    /** Nothing is delivered after this hour, in the store's own timezone. */
    public static final int LAST_HOUR = 22;

    /** Baskets at or above this go standard for nothing. */
    public static final BigDecimal FREE_ABOVE = new BigDecimal("50.00");

    public boolean booksAWindow() {
        return this == STANDARD;
    }

    /**
     * The delivery fee for a basket of this size.
     *
     * <p>Express is a flat $10 premium over standard in both tiers. Fixed at
     * placement and never recalculated — a basket that earned free delivery
     * keeps it even when the picker cannot find half of it.
     */
    public BigDecimal feeFor(BigDecimal basketSubtotal) {
        boolean freeTier = basketSubtotal.compareTo(FREE_ABOVE) >= 0;

        return switch (this) {
            case STANDARD -> freeTier ? BigDecimal.ZERO : new BigDecimal("5.00");
            case EXPRESS  -> freeTier ? new BigDecimal("10.00") : new BigDecimal("15.00");
        };
    }
}
