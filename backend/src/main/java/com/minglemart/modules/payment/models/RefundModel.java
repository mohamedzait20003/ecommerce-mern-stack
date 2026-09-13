package com.minglemart.modules.payment.models;

import lombok.*;
import java.util.UUID;
import java.time.Instant;
import java.math.BigDecimal;
import jakarta.persistence.*;
import org.hibernate.type.SqlTypes;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.JdbcTypeCode;

import com.minglemart.shared.common.ActorType;
import com.minglemart.shared.common.Money;
import com.minglemart.shared.domain.BaseModel;
import com.minglemart.shared.enums.RefundReason;
import com.minglemart.shared.enums.RefundStatus;

@Entity
@Table(name = "refunds")
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class RefundModel extends BaseModel {

    @Column(name = "payment_id", nullable = false, updatable = false)
    private UUID paymentId;

    @Column(name = "order_id", nullable = false, updatable = false)
    private UUID orderId;

    @Column(name = "amount", nullable = false, precision = 19, scale = 4)
    private BigDecimal amount;

    @Builder.Default
    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "currency", nullable = false, length = 3)
    private String currency = "USD";

    @Enumerated(EnumType.STRING)
    @Column(name = "reason", nullable = false, length = 32)
    private RefundReason reason;

    @Column(name = "reason_note")
    private String reasonNote;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 24)
    private RefundStatus status = RefundStatus.REQUESTED;

    @Column(name = "provider_refund_id")
    private String providerRefundId;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "requested_by_actor", nullable = false, length = 16)
    private ActorType requestedByActor = ActorType.USER;

    @Column(name = "requested_by_user_id")
    private UUID requestedByUserId;

    @Column(name = "approved_by_user_id")
    private UUID approvedByUserId;

    @Column(name = "approved_at")
    private Instant approvedAt;

    @Column(name = "idempotency_key", unique = true, length = 128)
    private String idempotencyKey;

    @Column(name = "failure_message")
    private String failureMessage;

    @Column(name = "processed_at")
    private Instant processedAt;

    public Money money() {
        return new Money(amount, currency);
    }

    /** The schema refuses an APPROVED row that does not name who approved it. */
    public void approve(UUID approver, Instant when) {
        this.status = RefundStatus.APPROVED;
        this.approvedByUserId = approver;
        this.approvedAt = when;
    }
}
