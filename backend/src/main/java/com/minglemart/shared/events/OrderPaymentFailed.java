package com.minglemart.shared.events;

import java.util.UUID;

import org.springframework.modulith.events.Externalized;

/**
 * A capture was declined with the goods already picked.
 *
 * <p>Rare, because the issuer already agreed to this money when the hold went
 * on. Rare enough that nothing retries it on a timer — this event exists to put
 * it in front of a person.
 */
@Externalized("minglemart.orders::order.payment-failed")
public record OrderPaymentFailed(
        UUID orderId,
        String orderNumber,
        UUID userId,
        String failureCode,
        String failureMessage) {
}
