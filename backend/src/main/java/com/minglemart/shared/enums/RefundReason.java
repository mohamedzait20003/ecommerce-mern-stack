package com.minglemart.shared.enums;

/**
 * Mirrors the CHECK constraint on {@code refunds.reason}.
 *
 * <p>Short list, because refunds are rare here by design: nothing is charged
 * until a picker has been through the order, so a shortfall never becomes a
 * refund. What is left is what goes wrong after the goods leave the store.
 */
public enum RefundReason {
    REQUESTED_BY_CUSTOMER,
    DAMAGED,
    WRONG_ITEM,
    NOT_DELIVERED,
    DUPLICATE,
    FRAUDULENT,
    OTHER
}
