package com.minglemart.shared.enums;

/**
 * How one knock on one door went. Mirrors the CHECK constraint on
 * {@code delivery_attempts.outcome}.
 *
 * <p>Attempts are append-only against a single delivery, which is the whole
 * point of having them: nobody answering the door is one failed attempt, not a
 * failed delivery, and the second knock must never erase the first — that
 * difference is what a customer dispute and a driver's record both turn on.
 */
public enum DeliveryAttemptOutcome {
    DELIVERED,
    /** Nobody home. Worth another try. */
    NO_ANSWER,
    /** They were there and did not want it. */
    REFUSED,
    /** The address could not be found or could not be reached. */
    ADDRESS_PROBLEM,
    RESCHEDULED;

    /** Whether the goods can reasonably be brought back another time. */
    public boolean worthRetrying() {
        return this == NO_ANSWER || this == ADDRESS_PROBLEM || this == RESCHEDULED;
    }
}
