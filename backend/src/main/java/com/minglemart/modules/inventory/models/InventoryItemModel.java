package com.minglemart.modules.inventory.models;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import org.hibernate.annotations.Generated;
import org.hibernate.generator.EventType;

/**
 * What is on the shelf, one row per variant.
 *
 * <p>Does not extend {@code BaseModel}: the primary key IS the variant id.
 * There is nothing to say about a stock level that is not about the variant it
 * belongs to, so a surrogate key would only add a second way to name the same
 * thing.
 */
@Entity
@Table(name = "inventory_items")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryItemModel {

    @Id
    @Column(name = "variant_id", updatable = false, nullable = false)
    private UUID variantId;

    /**
     * Decimal, not integer: 12.400 kg of loose apples is as ordinary a shelf
     * quantity as 12 tins, and a deli pick takes 0.540 of a pound off it.
     */
    @Builder.Default
    @Column(name = "quantity_on_hand", nullable = false, precision = 12, scale = 3)
    private BigDecimal quantityOnHand = BigDecimal.ZERO;

    /**
     * Vestigial. Nothing writes reservations any more — carts hold no stock and
     * a pick takes goods outright — but the column is NOT NULL, so it is mapped
     * and left at zero.
     */
    @Builder.Default
    @Column(name = "quantity_reserved", nullable = false, precision = 12, scale = 3)
    private BigDecimal quantityReserved = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "reorder_level", nullable = false)
    private int reorderLevel = 0;

    @Builder.Default
    @Column(name = "allow_backorder", nullable = false)
    private boolean allowBackorder = false;

    @Generated(event = { EventType.INSERT, EventType.UPDATE })
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    /** What could be sold right now. */
    public BigDecimal available() {
        return quantityOnHand.subtract(quantityReserved);
    }

    /** True when the shelf has fallen to where someone should be reordering. */
    public boolean needsReorder() {
        return available().compareTo(BigDecimal.valueOf(reorderLevel)) <= 0;
    }
}
