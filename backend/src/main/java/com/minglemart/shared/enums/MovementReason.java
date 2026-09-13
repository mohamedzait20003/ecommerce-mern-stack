package com.minglemart.shared.enums;

/**
 * Why stock moved. Mirrors the CHECK constraint on
 * {@code stock_movements.reason}.
 *
 * <p>The ledger is append-only and every change to {@code quantity_on_hand}
 * lands in it, so these five are the complete vocabulary for explaining any
 * difference between what the shelf held yesterday and what it holds now.
 */
public enum MovementReason {
    /** Goods arriving, or an abandoned pick of ambient stock going back. */
    RESTOCK,
    /** A picker taking it off the shelf for an order. Always negative. */
    FULFILMENT,
    /** A customer sending it back. */
    RETURN,
    /** A count correction. Someone looked, and the number was wrong. */
    ADJUSTMENT,
    /**
     * Written off. Where an abandoned pick of chilled or frozen stock ends up,
     * since it has been out of temperature control too long to sell.
     */
    DAMAGE;

    /** True for the reasons that add to the shelf rather than take from it. */
    public boolean increasesStock() {
        return this == RESTOCK || this == RETURN;
    }

    /**
     * Whether a delta of this sign makes sense for this reason. A FULFILMENT
     * that adds stock is a bug rather than a correction, and catching it here
     * stops a wrong sign quietly becoming a permanent ledger row.
     */
    public boolean permits(int sign) {
        return switch (this) {
            case RESTOCK, RETURN -> sign > 0;
            case FULFILMENT, DAMAGE -> sign < 0;
            case ADJUSTMENT -> sign != 0;
        };
    }
}
