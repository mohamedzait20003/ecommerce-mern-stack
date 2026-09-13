package com.minglemart.modules.payment.controllers;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.minglemart.modules.payment.gateway.StripeGateway;
import com.minglemart.modules.payment.services.PaymentEventService;
import com.minglemart.shared.domain.BaseController;

/**
 * Where the provider tells us what happened.
 *
 * <p>Three things make this endpoint different from every other one here.
 *
 * <p>The body is taken as a {@code String} and not a parsed object, because the
 * signature covers the raw bytes: deserialise and re-serialise it first and the
 * signature stops matching, which is the usual way this check gets accidentally
 * disabled.
 *
 * <p>It answers 200 as soon as the event is written down, before anything has
 * acted on it. The provider is being told "this is recorded", not "the order is
 * updated" — so a slow consumer cannot cause a redelivery storm, and a crashed
 * one cannot lose the event.
 *
 * <p>And it is unauthenticated, because the caller is Stripe and not a signed-in
 * user. The signature IS the authentication, which is why a body that fails it
 * gets a 400 and never reaches the inbox.
 */
@RestController
@RequestMapping("/api/webhooks/stripe")
public class PaymentWebhookController extends BaseController {

    private final PaymentEventService events;

    public PaymentWebhookController(PaymentEventService events) {
        this.events = events;
    }

    @PostMapping
    public ResponseEntity<String> receive(@RequestBody String rawBody,
                                          @RequestHeader("Stripe-Signature") String signature) {
        try {
            boolean recorded = events.record(rawBody, signature);

            // Draining here is a convenience, not the contract. If it throws,
            // the event is already safely on the queue and the provider still
            // gets its 200.
            if (recorded) {
                try {
                    events.drain();
                } catch (RuntimeException deferred) {
                    log.warn("Webhook recorded but not yet applied: {}", deferred.getMessage());
                }
            }

            return ResponseEntity.ok(recorded ? "recorded" : "duplicate");

        } catch (StripeGateway.SignatureException forged) {
            // Never log the body: it is unverified, and may be anything at all.
            log.warn("Rejected a webhook with an invalid signature");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("bad signature");
        }
    }
}
