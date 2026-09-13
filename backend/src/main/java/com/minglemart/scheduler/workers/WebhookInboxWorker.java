package com.minglemart.scheduler.workers;

import java.time.Duration;
import java.time.Instant;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.minglemart.shared.contracts.PaymentOperations;

/**
 * Drains the webhook inbox, and shouts when it is not draining.
 *
 * <p>The webhook endpoint records first and acts second, then drains
 * opportunistically. If the request dies between the two, the row is safe but
 * nothing acts on it — this does. And a row that is STILL unprocessed after
 * five minutes is the alarm worth building before any other: the provider
 * believes something about a payment that this system does not.
 */
@Component
public class WebhookInboxWorker {

    private static final Logger log = LoggerFactory.getLogger(WebhookInboxWorker.class);

    private static final Duration STUCK_AFTER = Duration.ofMinutes(5);

    private final PaymentOperations payments;

    public WebhookInboxWorker(PaymentOperations payments) {
        this.payments = payments;
    }

    @Scheduled(fixedDelayString = "${minglemart.scheduler.webhooks.drain-interval:30s}")
    public void drain() {
        int handled = payments.drainWebhookInbox();
        if (handled > 0) {
            log.info("Applied {} webhook(s) the request path had not", handled);
        }

        int stuck = payments.countStuckWebhooks(Instant.now().minus(STUCK_AFTER));
        if (stuck > 0) {
            log.error("ALARM: {} webhook(s) unprocessed for over {} — Stripe and this system disagree",
                    stuck, STUCK_AFTER);
        }
    }
}
