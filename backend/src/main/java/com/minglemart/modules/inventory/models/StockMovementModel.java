package com.minglemart.modules.inventory.models;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import org.hibernate.annotations.Generated;
import org.hibernate.generator.EventType;

import com.minglemart.shared.common.ActorType;
import com.minglemart.shared.enums.MovementReason;

/**
 * Every change to {@code quantity_on_hand}, in order, forever.
 *
 * <p>Append-only, which is why it has no {@code updated_at} and no setters: a
 * movement that could be edited is not a ledger. Stock is reconstructable by
 * summing these, and any discrepancy has a row explaining who caused it.
 */
@Entity
@Table(name = "stock_movements")
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockMovementModel {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "variant_id", nullable = false, updatable = false)
    private UUID variantId;

    /** Signed: positive on restock and return, negative on fulfilment and damage. */
    @Column(name = "quantity_delta", nullable = false, updatable = false, precision = 12, scale = 3)
    private BigDecimal quantityDelta;

    @Enumerated(EnumType.STRING)
    @Column(name = "reason", nullable = false, updatable = false, length = 32)
    private MovementReason reason;

    /** What caused it — {@code "PICK"}, {@code "ORDER"} — and that thing's id. */
    @Column(name = "reference_type", updatable = false, length = 16)
    private String referenceType;

    @Column(name = "reference_id", updatable = false)
    private UUID referenceId;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "actor_type", nullable = false, updatable = false, length = 16)
    private ActorType actorType = ActorType.SYSTEM;

    /** Null for a SYSTEM movement, which is most of them. */
    @Column(name = "actor_user_id", updatable = false)
    private UUID actorUserId;

    @Column(name = "note", updatable = false)
    private String note;

    @Generated(event = EventType.INSERT)
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
