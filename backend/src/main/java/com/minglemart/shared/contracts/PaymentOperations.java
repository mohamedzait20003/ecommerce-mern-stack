package com.minglemart.shared.contracts;

import com.minglemart.shared.common.ActorRef;
import com.minglemart.shared.common.Money;
import com.minglemart.shared.enums.PaymentStatus;
import com.minglemart.shared.enums.RefundReason;
import com.minglemart.shared.enums.RefundStatus;

import java.time.Instant;
import java.util.UUID;

/**
 * Money, as the rest of the system is allowed to move it.
 *
 * <p>Two calls, far apart in time, and the distance between them is the point.
 * {@link #authorize} runs at checkout with the shopper present: a dead card
 * fails there, before a picker has walked a single aisle, and any card
 * challenge is answered by somebody who is actually at the keyboard.
 * {@link #capture} runs after the pick, for what was found, and needs no second
 * authentication because the first one carried it.
 */
public interface PaymentOperations {

    /**
     * Whether this customer may place an order at all: an active billing
     * account with a method that can be charged. Checked before placement,
     * because an order with nothing to hold is picking labour spent on a
     * promise.
     */
    boolean canPay(UUID userId);

    /** The billing account an order placed now would be charged against. */
    java.util.Optional<UUID> billingAccountId(UUID userId);

    /** Places the hold. The amount is the order's ceiling, not its estimate. */
    PaymentResult authorize(AuthorizeOrder command);

    /** Takes it, for what was actually picked. At or below what was held. */
    PaymentResult capture(CaptureOrder command);

    /** Gives back an untaken hold. A cancelled order should cost nobody anything. */
    void releaseHold(UUID orderId, String reason, ActorRef actor);

    /**
     * Opens a refund request. It lands at {@link RefundStatus#REQUESTED} and
     * stops there — an agent may ask, but money leaving needs a human owner.
     */
    RefundResult requestRefund(RequestRefund command);

    /**
     * Acts on webhooks recorded and not yet handled. The webhook endpoint
     * drains opportunistically after recording; this is the reliable version,
     * on the clock, for the rows a crashed request left behind.
     *
     * @return how many were handled
     */
    int drainWebhookInbox();

    /**
     * Webhooks the provider delivered that nothing here has acted on for too
     * long. The one alarm worth building first: Stripe thinks you were paid,
     * and the order does not agree.
     */
    int countStuckWebhooks(Instant olderThan);

    record AuthorizeOrder(
        UUID orderId,
        UUID userId,
        /** The ceiling: the estimate plus headroom for weighed lines. */
        Money amount,
        String idempotencyKey,
        ActorRef actor
    ) {}

    record CaptureOrder(
        UUID orderId,
        /** What the pick came to. Never more than was held. */
        Money amount,
        String idempotencyKey,
        ActorRef actor
    ) {}

    /**
     * {@code clientSecret} is non-null only when the issuer wants the
     * cardholder to answer something — which at checkout they can.
     */
    record PaymentResult(UUID paymentId, PaymentStatus status, String clientSecret) {}

    record RequestRefund(
        UUID orderId,
        UUID paymentId,
        Money amount,
        RefundReason reason,
        String note,
        String idempotencyKey,
        ActorRef actor
    ) {}

    record RefundResult(UUID refundId, RefundStatus status) {}
}
