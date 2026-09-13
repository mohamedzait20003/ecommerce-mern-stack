package com.minglemart.modules.payment.dtos;

/**
 * What the browser needs to collect a card with Stripe Elements: the
 * SetupIntent's client secret. The card number never touches this server — the
 * browser hands it to Stripe, Stripe confirms the intent, and the finished
 * method comes back here on a webhook.
 */
public record SetupResponse(String clientSecret) {
}
