package com.minglemart.shared.common;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Objects;

/**
 * An amount and its ISO-4217 currency, mirroring the schema's
 * {@code numeric(19,4) + char(3)} pairing. Never use a floating point type for
 * money.
 */
public record Money(BigDecimal amount, String currency) {

    /** Every amount column in the schema is {@code numeric(19,4)}. */
    private static final int SCALE = 4;

    public Money {
        Objects.requireNonNull(amount, "amount");
        Objects.requireNonNull(currency, "currency");
        if (currency.length() != 3) {
            throw new IllegalArgumentException("currency must be an ISO-4217 code: " + currency);
        }
    }

    public static Money of(String amount, String currency) {
        return new Money(new BigDecimal(amount), currency);
    }

    public static Money zero(String currency) {
        return new Money(BigDecimal.ZERO, currency);
    }

    public Money plus(Money other) {
        requireSameCurrency(other);
        return new Money(amount.add(other.amount), currency);
    }

    public Money times(int quantity) {
        return times(BigDecimal.valueOf(quantity));
    }

    /**
     * Rounded to the four decimals the schema stores, because a weighed line
     * multiplies by a fraction: 0.55 lb of ham at $8.99 does not land on four
     * places by itself, and an unrounded value would fail the column it is
     * written to.
     */
    public Money times(BigDecimal quantity) {
        return new Money(amount.multiply(quantity).setScale(SCALE, RoundingMode.HALF_UP), currency);
    }

    /** True when this is strictly more than {@code other}. */
    public boolean isMoreThan(Money other) {
        requireSameCurrency(other);
        return amount.compareTo(other.amount) > 0;
    }

    private void requireSameCurrency(Money other) {
        if (!currency.equals(other.currency)) {
            throw new IllegalArgumentException(
                    "cannot combine %s and %s".formatted(currency, other.currency));
        }
    }
}
