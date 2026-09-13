package com.minglemart.modules.inventory.models;

import java.math.BigDecimal;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import lombok.Getter;
import lombok.NoArgsConstructor;

import org.hibernate.annotations.Immutable;

/**
 * Sellable quantity, as anyone outside this module should read it. Backed by
 * the {@code inventory_available} view, so the on-hand minus reserved
 * subtraction lives in one place rather than in every caller.
 *
 * <p>A variant nobody has ever stocked has no row here at all — which reads the
 * same as an empty shelf for the only question being asked of it.
 */
@Entity
@Immutable
@Table(name = "inventory_available")
@Getter
@NoArgsConstructor
public class InventoryAvailableView {

    @Id
    @Column(name = "variant_id")
    private UUID variantId;

    @Column(name = "quantity_on_hand", precision = 12, scale = 3)
    private BigDecimal quantityOnHand;

    @Column(name = "quantity_reserved", precision = 12, scale = 3)
    private BigDecimal quantityReserved;

    @Column(name = "quantity_available", precision = 12, scale = 3)
    private BigDecimal quantityAvailable;

    @Column(name = "allow_backorder")
    private boolean allowBackorder;
}
