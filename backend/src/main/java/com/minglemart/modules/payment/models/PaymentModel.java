package com.minglemart.modules.payment.models;

import lombok.*;
import java.util.UUID;
import java.time.Instant;
import java.util.Optional;
import java.math.BigDecimal;
import jakarta.persistence.*;
import org.hibernate.type.SqlTypes;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.JdbcTypeCode;

import com.minglemart.shared.common.Money;
import com.minglemart.shared.common.ActorType;
import com.minglemart.shared.domain.BaseModel;
import com.minglemart.shared.enums.PaymentStatus;

@Entity
@Table(name = "payments")
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentModel extends BaseModel {

    @Column(name = "order_id", nullable = false, updatable = false)
    private UUID orderId;

    @Column(name = "payment_method_id")
    private UUID paymentMethodId;

    @Builder.Default
    @Column(name = "provider", nullable = false, length = 32)
    private String provider = "STRIPE";

    /** The provider's own id for the intent. */
    @Column(name = "provider_payment_id")
    private String providerPaymentId;

    /** Present only while a card flow still needs the cardholder to act. */
    @Column(name = "provider_client_secret")
    private String providerClientSecret;

    /** What was held. The capture takes this or less, never more. */
    @Column(name = "amount", nullable = false, precision = 19, scale = 4)
    private BigDecimal amount;

    @Builder.Default
    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "currency", nullable = false, length = 3)
    private String currency = "USD";

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 24)
    private PaymentStatus status = PaymentStatus.PENDING;

    @Builder.Default
    @Column(name = "refunded_amount", nullable = false, precision = 19, scale = 4)
    private BigDecimal refundedAmount = BigDecimal.ZERO;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "actor_type", nullable = false, length = 16)
    private ActorType actorType = ActorType.USER;

    /** Stops a retried call charging the customer twice. */
    @Column(name = "idempotency_key", unique = true, length = 128)
    private String idempotencyKey;

    @Column(name = "failure_code", length = 64)
    private String failureCode;

    @Column(name = "failure_message")
    private String failureMessage;

    /**
     * A record rather than a schedule. Nothing retries a failed capture on a
     * timer: the hold was already agreed by the issuer, so a capture that still
     * fails is unusual enough to want a person looking at it.
     */
    @Builder.Default
    @Column(name = "attempt_count", nullable = false)
    private int attemptCount = 0;

    @Column(name = "first_failed_at")
    private Instant firstFailedAt;

    @Column(name = "authorized_at")
    private Instant authorizedAt;

    @Column(name = "captured_at")
    private Instant capturedAt;

    public Money held() {
        return new Money(amount, currency);
    }

    public Optional<Money> refunded() {
        return refundedAmount.signum() == 0 ? Optional.empty() : Optional.of(new Money(refundedAmount, currency));
    }

    public void markAuthorised(String providerPaymentId, Instant when) {
        this.providerPaymentId = providerPaymentId;
        this.status = PaymentStatus.AUTHORIZED;
        this.authorizedAt = when;
        this.failureCode = null;
        this.failureMessage = null;
    }

    public void markCaptured(BigDecimal captured, Instant when) {
        this.amount = captured;
        this.status = PaymentStatus.CAPTURED;
        this.capturedAt = when;
    }

    public void markFailed(String code, String message) {
        this.status = PaymentStatus.FAILED;
        this.failureCode = code;
        this.failureMessage = message;
        this.attemptCount++;
        
        if (this.firstFailedAt == null) {
            this.firstFailedAt = Instant.now();
        }
    }
}
