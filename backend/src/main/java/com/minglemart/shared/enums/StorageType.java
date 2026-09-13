package com.minglemart.shared.enums;

/**
 * How a product is held, and therefore what happens to it when a picked order
 * is abandoned. Mirrors the CHECK constraint on {@code products.storage_type}.
 *
 * <p>This is not a merchandising label. A capture that fails after picking
 * leaves a bagged order nobody is coming for, and the difference between
 * {@link #AMBIENT} and the other two is the difference between stock going back
 * on the shelf and stock being written off.
 */
public enum StorageType {
    /** Goes back on the shelf as a {@code RESTOCK} movement. */
    AMBIENT,
    /** Out of temperature control by then. Written off as {@code DAMAGE}. */
    CHILLED,
    /** Same. */
    FROZEN;

    /** Whether an abandoned pick of this can be returned to stock. */
    public boolean restockable() {
        return this == AMBIENT;
    }
}
