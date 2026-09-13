package com.minglemart.shared.enums;

/** Mirrors the CHECK constraint on {@code payment_methods.method_type}. */
public enum PaymentMethodType {
    CARD,
    WALLET,
    BANK_TRANSFER,
    /**
     * Present in the schema, unusable in this flow: there is nothing to
     * authorise at checkout, so a picker would walk the store with no promise
     * of payment behind them.
     */
    CASH_ON_DELIVERY;

    /** Whether a hold can be placed on this before the goods are picked. */
    public boolean canBeAuthorised() {
        return this != CASH_ON_DELIVERY;
    }
}
