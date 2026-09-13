package com.minglemart.shared.enums;

/**
 * How a shopper says how much they want. Mirrors the CHECK constraint on
 * {@code product_variants.sell_by}.
 *
 * <p>Deliberately separate from {@link PriceBy}: a whole chicken is counted by
 * the piece but priced by the pound, and collapsing the two would make that
 * ordinary case impossible to express.
 */
public enum SellBy {
    /** "Two of them." A tin, a loaf, one bird. */
    EACH,
    /** "Half a pound of it." The deli counter and the loose bins. */
    WEIGHT
}
