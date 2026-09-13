package com.minglemart.modules.payment.models;

import lombok.*;
import java.util.UUID;
import java.time.Instant;
import jakarta.persistence.*;
import org.hibernate.type.SqlTypes;
import org.hibernate.generator.EventType;
import org.hibernate.annotations.Generated;
import org.hibernate.annotations.JdbcTypeCode;

@Entity
@Table(name = "payment_events")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentEventModel {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "payment_id")
    private UUID paymentId;

    @Column(name = "refund_id")
    private UUID refundId;

    @Builder.Default
    @Column(name = "provider", nullable = false, updatable = false, length = 32)
    private String provider = "STRIPE";

    /** The provider's own event id. Half of the constraint that stops a replay. */
    @Column(name = "provider_event_id", nullable = false, updatable = false)
    private String providerEventId;

    @Column(name = "event_type", nullable = false, updatable = false, length = 64)
    private String eventType;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "payload", nullable = false, updatable = false)
    private String payload;

    /** Null until a consumer has acted on it. */
    @Column(name = "processed_at")
    private Instant processedAt;

    @Generated(event = EventType.INSERT)
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public boolean handled() {
        return processedAt != null;
    }
}
