package com.minglemart.modules.payment.models;

import lombok.*;
import java.util.UUID;
import java.time.Instant;
import jakarta.persistence.*;
import org.hibernate.type.SqlTypes;
import org.hibernate.generator.EventType;
import org.hibernate.annotations.Generated;
import org.hibernate.annotations.JdbcTypeCode;

import com.minglemart.shared.enums.PaymentMethodType;

@Entity
@Table(name = "payment_methods")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentMethodModel {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "user_id", nullable = false, updatable = false)
    private UUID userId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "billing_account_id", nullable = false)
    private BillingAccountModel billingAccount;

    @Builder.Default
    @Column(name = "provider", nullable = false, length = 32)
    private String provider = "STRIPE";

    /** Stripe's {@code pm_...}. */
    @Column(name = "provider_token", nullable = false)
    private String providerToken;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "method_type", nullable = false, length = 24)
    private PaymentMethodType methodType = PaymentMethodType.CARD;

    @Column(name = "brand", length = 32)
    private String brand;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "last4", length = 4)
    private String last4;

    @Column(name = "exp_month")
    private Short expMonth;

    @Column(name = "exp_year")
    private Short expYear;

    @Builder.Default
    @Column(name = "is_default", nullable = false)
    private boolean defaultMethod = false;

    @Builder.Default
    @Column(name = "off_session_ok", nullable = false)
    private boolean offSessionOk = false;

    @Column(name = "provider_setup_intent_id")
    private String providerSetupIntentId;

    @Generated(event = EventType.INSERT)
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    public boolean usable() {
        return deletedAt == null && offSessionOk && methodType.canBeAuthorised();
    }

    /** "Visa ending 4242", or just the brand when there is no number to show. */
    public String describe() {
        return last4 == null ? brand : "%s ending %s".formatted(brand, last4);
    }
}
