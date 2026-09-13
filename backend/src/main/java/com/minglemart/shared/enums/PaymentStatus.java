package com.minglemart.shared.enums;

/**
 * Where a payment attempt has got to. Mirrors the CHECK constraint on
 * {@code payments.status}.
 *
 * <p>The two that matter are {@link #AUTHORIZED} and {@link #CAPTURED}, and the
 * gap between them is where a picker walks the store. Authorising while the
 * shopper is present is what makes the later capture almost certain: the issuer
 * has already agreed to the money and set it aside.
 */
public enum PaymentStatus {
    /** Created, nothing agreed yet. */
    PENDING,
    /** The issuer wants the cardholder to answer a challenge. */
    REQUIRES_ACTION,
    /** Funds held. Safe to spend picking labour against. */
    AUTHORIZED,
    /** Taken, for what was actually picked. */
    CAPTURED,
    FAILED,
    /** The hold was released deliberately — a cancelled order costs nobody anything. */
    CANCELLED,
    /** The hold lapsed before it was captured. */
    EXPIRED;

    /** Whether money is currently set aside against this. */
    public boolean holding() {
        return this == AUTHORIZED;
    }

    public boolean settled() {
        return this == CAPTURED;
    }

    /** Nothing further will happen without somebody starting again. */
    public boolean dead() {
        return this == FAILED || this == CANCELLED || this == EXPIRED;
    }
}
