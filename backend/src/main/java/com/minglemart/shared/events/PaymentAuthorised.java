package com.minglemart.shared.events;

import java.util.UUID;

/**
 * The provider confirmed a hold went on.
 *
 * <p>Usually redundant: the checkout request already moved the order when the
 * authorise call succeeded. It is not redundant on the path where the issuer
 * asked the cardholder for a challenge — the request returned with the order
 * still PLACED, the browser completed the challenge with the provider, and
 * this webhook is the first this system hears that the hold is real. In-process
 * only; nothing outside needs it.
 */
public record PaymentAuthorised(UUID orderId, UUID paymentId) {
}
