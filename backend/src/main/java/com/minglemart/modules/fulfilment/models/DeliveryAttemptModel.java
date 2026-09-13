package com.minglemart.modules.fulfilment.models;

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

import com.minglemart.shared.enums.DeliveryAttemptOutcome;

/**
 * One knock on one door.
 *
 * <p>Append-only, and that is the entire point. Nobody answering is one failed
 * attempt, not a failed delivery, and the second knock must never overwrite the
 * first — which is what both a customer dispute and a driver's record depend
 * on. Hence no setters beyond the parent link, and no {@code updated_at}.
 */
@Entity
@Table(name = "delivery_attempts")
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeliveryAttemptModel {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Setter
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "delivery_id", nullable = false)
    private DeliveryModel delivery;

    @Column(name = "attempt_no", nullable = false, updatable = false)
    private int attemptNo;

    @Column(name = "driver_id", updatable = false)
    private UUID driverId;

    @Enumerated(EnumType.STRING)
    @Column(name = "outcome", nullable = false, updatable = false, length = 24)
    private DeliveryAttemptOutcome outcome;

    @Column(name = "note", updatable = false)
    private String note;

    @Generated(event = EventType.INSERT)
    @Column(name = "occurred_at", nullable = false, updatable = false)
    private Instant occurredAt;
}
