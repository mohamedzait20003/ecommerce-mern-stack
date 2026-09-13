package com.minglemart.shared.enums;

/**
 * The unit {@code product_variants.net_content} is measured in, for the
 * shelf-edge unit price — the "$0.42/oz" that lets a shopper compare two boxes
 * of different sizes. Mirrors the CHECK constraint on
 * {@code product_variants.net_content_unit}.
 *
 * <p>Nothing to do with {@link PriceUnit}. A tin of tomatoes is priced per tin
 * and still has to display a price per ounce, so the two live apart.
 */
public enum NetContentUnit {
    G, KG, ML, L, OZ, LB, FLOZ,
    /** A count: six bagels, twelve cans. */
    CT
}
