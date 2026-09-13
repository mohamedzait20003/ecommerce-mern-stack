package com.minglemart.shared.enums;

/**
 * What happened when a picker reached the shelf, per ordered line. Mirrors the
 * CHECK constraint on {@code picked_items.outcome}.
 *
 * <p>This is the first and only time anyone asks whether the goods exist: carts
 * hold nothing and the authorisation moves nothing. A shortfall is therefore an
 * ordinary outcome of an ordinary question, not an error condition — and
 * because the card is captured for what was found, none of these becomes a
 * refund.
 */
public enum PickOutcome {
    /** Found, all of it. */
    FULL,
    /** Found some. The customer is billed for what went in the bag. */
    SHORT,
    /** Found none, and no swap went in either. */
    UNAVAILABLE,
    /** A different variant went in, with the customer agreeing at the shelf. */
    SUBSTITUTED;

    /** Whether anything left the shelf, and so whether stock moved. */
    public boolean tookStock() {
        return this == FULL || this == SHORT || this == SUBSTITUTED;
    }
}
