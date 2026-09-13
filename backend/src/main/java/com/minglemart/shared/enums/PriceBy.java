package com.minglemart.shared.enums;

/**
 * What {@code product_variants.price_amount} is the price OF. Mirrors the CHECK
 * constraint on {@code product_variants.price_by}.
 *
 * <p>This is the flag that decides whether a line's cost is known at checkout.
 * {@link #EACH} lines are settled the moment they enter the basket; {@link
 * #WEIGHT} lines are an estimate until a picker puts them on a scale, which is
 * the entire reason the card is authorised for more than the basket says.
 */
public enum PriceBy {
    /** Per item. Two tins at $1.19 is $2.38, and nothing later changes it. */
    EACH,
    /** Per {@link PriceUnit}. The scale has the last word. */
    WEIGHT
}
