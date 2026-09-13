package com.minglemart.shared.enums;

/**
 * Whether a customer's identity at the payment provider can be charged.
 * Mirrors the CHECK constraint on {@code billing_accounts.status}.
 */
public enum BillingAccountStatus {
    /** The provider customer exists; no usable method is attached yet. */
    PENDING,
    /** Has at least one method that may be charged. */
    ACTIVE,
    /** Blocked — chargebacks, fraud review. No order may be placed against it. */
    SUSPENDED;

    public boolean chargeable() {
        return this == ACTIVE;
    }
}
