package com.minglemart.shared.enums;

/**
 * Where a delivery has got to. Mirrors the CHECK constraint on
 * {@code deliveries.status}.
 */
public enum DeliveryStatus {
    UNASSIGNED,
    ASSIGNED,
    /** The driver has the bags. */
    COLLECTED,
    IN_TRANSIT,
    DELIVERED,
    /** Every attempt used up, and the goods are still on the van. */
    FAILED,
    /** Back at the store. */
    RETURNED;

    /** Whether a driver is currently attached, which the schema ties to this. */
    public boolean claimed() {
        return this != UNASSIGNED;
    }

    public boolean open() {
        return this == UNASSIGNED || this == ASSIGNED || this == COLLECTED || this == IN_TRANSIT;
    }

    public boolean finished() {
        return this == DELIVERED || this == RETURNED;
    }
}
