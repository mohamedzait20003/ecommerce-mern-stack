package com.minglemart.modules.order.dtos;

/**
 * The order, plus what the browser has to do next.
 *
 * <p>{@code clientSecret} is null when the hold went straight on. When it is
 * not, the issuer wants the cardholder to answer a challenge: the browser
 * hands the secret to Stripe.js, the shopper completes it, and the order —
 * still PLACED here — moves to AUTHORIZED when the provider's webhook confirms
 * the hold. The order page's live stream will show that happen.
 */
public record CheckoutResponse(OrderResponse order, String clientSecret) {
}
