package com.minglemart.shared.enums;

import java.util.EnumSet;
import java.util.Set;

/**
 * Where an order has got to. Mirrors the CHECK constraint on
 * {@code orders.status}, and is declared in the order things happen.
 *
 * <p>Money is held early and taken late: {@link #AUTHORIZED} is the hold going
 * on at checkout while the shopper is present, and {@link #AWAITING_PAYMENT} is
 * the capture running after the pick, when they are not. Everything between
 * those two is a person walking a store.
 */
public enum OrderStatus {
    /** Being assembled from a cart. Not yet anybody's promise. */
    PENDING,
    /** Submitted. The lines and the address are snapshotted; the card is not yet held. */
    PLACED,
    /** A hold is on the card. Safe to spend picking labour against. */
    AUTHORIZED,
    /** A picker has it. */
    PROCESSING,
    /** Picked and priced; the capture is running. */
    AWAITING_PAYMENT,
    /** Captured, for what was actually picked. */
    PAID,
    /** The capture was declined with the goods already bagged. Retried, then given up on. */
    PAYMENT_FAILED,
    /** With a driver. */
    SHIPPED,
    DELIVERED,
    CANCELLED,
    REFUNDED,
    PARTIALLY_REFUNDED;

    /** Statuses at or past the capture, which is where money has actually moved. */
    private static final Set<OrderStatus> CHARGED = EnumSet.of(
            PAID, SHIPPED, DELIVERED, REFUNDED, PARTIALLY_REFUNDED);

    /** Statuses that have a hold on a card behind them. */
    private static final Set<OrderStatus> HELD = EnumSet.of(
            AUTHORIZED, PROCESSING, AWAITING_PAYMENT, PAYMENT_FAILED);

    /** Nothing more will happen to an order in one of these. */
    private static final Set<OrderStatus> TERMINAL = EnumSet.of(
            DELIVERED, CANCELLED, REFUNDED);

    public boolean charged() {
        return CHARGED.contains(this);
    }

    /** True once the card carries a hold — which is what makes picking safe. */
    public boolean authorised() {
        return HELD.contains(this) || CHARGED.contains(this);
    }

    public boolean terminal() {
        return TERMINAL.contains(this);
    }

    /**
     * Whether a shopper may still call it off themselves. Cheap while it is
     * only a hold — voiding an authorisation costs nothing and refunds nobody —
     * and no longer their call once a picker is walking the aisles for it.
     */
    public boolean cancellableByCustomer() {
        return this == PENDING || this == PLACED || this == AUTHORIZED;
    }
}
