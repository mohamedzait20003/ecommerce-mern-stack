package com.minglemart.shared.enums;

/**
 * Where a pick has got to. Mirrors the CHECK constraint on
 * {@code picking_tasks.status}.
 *
 * <p>One task per order, because there is one store. Nothing moves an order
 * through these on its own — a moderator assigns, a picker walks, and a
 * moderator confirms.
 */
public enum PickingTaskStatus {
    /** Waiting on a moderator to give it to somebody. */
    UNASSIGNED,
    ASSIGNED,
    /** The picker is on the floor with it. */
    PICKING,
    /** Every line has a verdict; ready for a moderator to confirm. */
    PICKED,
    CANCELLED;

    /** Whether a picker is currently attached, which the schema ties to this. */
    public boolean claimed() {
        return this != UNASSIGNED;
    }

    public boolean open() {
        return this == UNASSIGNED || this == ASSIGNED || this == PICKING;
    }
}
