package com.minglemart.modules.payment.models;

import lombok.*;
import java.util.UUID;
import jakarta.persistence.*;
import lombok.experimental.SuperBuilder;

import com.minglemart.shared.domain.BaseModel;
import com.minglemart.shared.enums.BillingAccountStatus;

@Entity
@Table(name = "billing_accounts")
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class BillingAccountModel extends BaseModel {

    @Column(name = "user_id", nullable = false, updatable = false)
    private UUID userId;

    @Builder.Default
    @Column(name = "provider", nullable = false, updatable = false, length = 32)
    private String provider = "STRIPE";

    /** Stripe's {@code cus_...}. A reference, never card data. */
    @Column(name = "provider_customer_id", nullable = false, updatable = false)
    private String providerCustomerId;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 16)
    private BillingAccountStatus status = BillingAccountStatus.PENDING;

    public boolean chargeable() {
        return status.chargeable();
    }
}
