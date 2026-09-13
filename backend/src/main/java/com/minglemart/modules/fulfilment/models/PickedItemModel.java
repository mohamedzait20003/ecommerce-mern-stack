package com.minglemart.modules.fulfilment.models;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import org.hibernate.annotations.Generated;
import org.hibernate.generator.EventType;

import com.minglemart.shared.enums.PickOutcome;
import com.minglemart.shared.enums.SubstituteStatus;

/**
 * One verdict, for one ordered line.
 *
 * <p>This is the row that explains a bill months later, so it records the
 * outcome even when the outcome was "nothing". A refused or unanswered swap
 * stays here with the variant that was offered — the schema keeps it precisely
 * so the question "why didn't I get my yoghurt" has an answer.
 */
@Entity
@Table(name = "picked_items")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PickedItemModel {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "picking_task_id", nullable = false)
    private PickingTaskModel pickingTask;

    @Column(name = "order_item_id", nullable = false, updatable = false)
    private UUID orderItemId;

    @Enumerated(EnumType.STRING)
    @Column(name = "outcome", nullable = false, length = 16)
    private PickOutcome outcome;

    /** In the line's selling unit; zero when the shelf was empty. */
    @Builder.Default
    @Column(name = "quantity_picked", nullable = false, precision = 12, scale = 3)
    private BigDecimal quantityPicked = BigDecimal.ZERO;

    /**
     * What the scale said. Only meaningful on a line priced by weight, and on a
     * catch-weight line it is the whole story: the shopper took one chicken,
     * and this is what that one chicken turned out to cost them.
     */
    @Column(name = "weight_picked", precision = 12, scale = 3)
    private BigDecimal weightPicked;

    @Column(name = "substitute_variant_id")
    private UUID substituteVariantId;

    @Column(name = "substitute_unit_price_amount", precision = 19, scale = 4)
    private BigDecimal substituteUnitPriceAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "substitute_status", length = 16)
    private SubstituteStatus substituteStatus;

    @Column(name = "substitute_proposed_at")
    private Instant substituteProposedAt;

    @Column(name = "substitute_decided_at")
    private Instant substituteDecidedAt;

    @Column(name = "note")
    private String note;

    @Generated(event = EventType.INSERT)
    @Column(name = "picked_at", nullable = false, updatable = false)
    private Instant pickedAt;

    /** A picker is standing in an aisle waiting on this one. */
    public boolean awaitingAnswer() {
        return substituteStatus == SubstituteStatus.PROPOSED;
    }

    public boolean tookStock() {
        return outcome != null && outcome.tookStock();
    }

    /**
     * The units this line is billed for. On a weighed line that is what came
     * off the scale, capped at the ceiling the shopper was quoted — an
     * over-weight pick still goes in the bag, they simply do not pay past the
     * band they agreed to, and that cap is what keeps the capture inside the
     * hold.
     */
    public BigDecimal billableUnits(BigDecimal lineCeiling) {
        BigDecimal actual = weightPicked != null ? weightPicked : quantityPicked;
        return lineCeiling != null && actual.compareTo(lineCeiling) > 0 ? lineCeiling : actual;
    }
}
