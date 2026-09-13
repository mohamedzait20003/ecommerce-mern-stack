package com.minglemart.shared.enums;

/**
 * The customer's answer to a swap, given while the picker is still standing at
 * the shelf. Mirrors the CHECK constraint on
 * {@code picked_items.substitute_status}.
 *
 * <p>This is the customer's only say in what they are charged, which is why it
 * has to resolve by itself: a picker cannot wait in the aisle indefinitely, and
 * {@link #TIMED_OUT} leaves the line unavailable rather than quietly putting
 * something they did not choose into the bag.
 */
public enum SubstituteStatus {
    /** Offered, and the picker is waiting. */
    PROPOSED,
    APPROVED,
    REJECTED,
    /** Nobody answered in time. */
    TIMED_OUT;

    /** Only an approved swap goes in the bag; the schema enforces it. */
    public boolean goesInTheBag() {
        return this == APPROVED;
    }

    public boolean settled() {
        return this != PROPOSED;
    }
}
