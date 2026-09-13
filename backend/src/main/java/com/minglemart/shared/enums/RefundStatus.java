package com.minglemart.shared.enums;

/**
 * Mirrors the CHECK constraint on {@code refunds.status}.
 *
 * <p>REQUESTED is where an agent-initiated refund lands and stops. Money
 * leaving needs a human owner, which is why {@code approved_by_user_id} is a
 * user and never an agent.
 */
public enum RefundStatus {
    REQUESTED,
    APPROVED,
    REJECTED,
    PROCESSING,
    SUCCEEDED,
    FAILED;

    public boolean open() {
        return this == REQUESTED || this == APPROVED || this == PROCESSING;
    }
}
