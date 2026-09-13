package com.minglemart.modules.payment.services;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import com.minglemart.modules.payment.gateway.StripeGateway;
import com.minglemart.modules.payment.models.PaymentEventModel;
import com.minglemart.modules.payment.models.PaymentModel;
import com.minglemart.modules.payment.repositories.PaymentEventRepository;
import com.minglemart.modules.payment.repositories.PaymentRepository;
import com.minglemart.shared.enums.PaymentStatus;
import com.minglemart.shared.events.PaymentAuthorised;

/**
 * The webhook inbox: write it down first, act on it second.
 *
 * <p>The 200 that goes back to the provider means "this is durably recorded
 * here", not "the order is updated". That distinction is what makes the whole
 * thing safe to crash in the middle of — the row survives, and
 * {@code processed_at IS NULL} is a queue somebody can drain.
 *
 * <p>Providers redeliver, so every path through here has to be safe to run
 * twice. The UNIQUE on {@code (provider, provider_event_id)} does the real
 * work: a replay fails the insert, and that failure IS the deduplication.
 */
@Service
public class PaymentEventService {

    private static final String PROVIDER = "STRIPE";

    private final Logger log = LoggerFactory.getLogger(getClass());

    private final PaymentEventRepository events;
    private final PaymentRepository payments;
    private final BillingAccountService accounts;
    private final StripeGateway gateway;
    private final ApplicationEventPublisher publisher;
    private final ObjectMapper json = new ObjectMapper();

    public PaymentEventService(PaymentEventRepository events,
                               PaymentRepository payments,
                               BillingAccountService accounts,
                               StripeGateway gateway,
                               ApplicationEventPublisher publisher) {
        this.events = events;
        this.payments = payments;
        this.accounts = accounts;
        this.gateway = gateway;
        this.publisher = publisher;
    }

    /**
     * Verifies the signature over the RAW body, records the event, and returns
     * whether it was new. A replay returns false and does nothing else.
     *
     * <p>Its own transaction: the record has to commit even if acting on it
     * afterwards blows up, because losing the record is the one failure that
     * cannot be recovered from.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public boolean record(String rawBody, String signatureHeader) {
        StripeGateway.WebhookEvent event = gateway.verify(rawBody, signatureHeader);

        if (events.existsByProviderAndProviderEventId(PROVIDER, event.id())) {
            log.debug("Ignoring replayed webhook {}", event.id());
            return false;
        }

        try {
            events.save(PaymentEventModel.builder()
                    .provider(PROVIDER)
                    .providerEventId(event.id())
                    .eventType(event.type())
                    .payload(event.payload())
                    .build());
            return true;
        } catch (DataIntegrityViolationException raced) {
            // Two deliveries arriving at once. The constraint settled it.
            log.debug("Webhook {} was recorded by a concurrent delivery", event.id());
            return false;
        }
    }

    /**
     * Acts on everything recorded and not yet handled.
     *
     * <p>Driven from the queue rather than straight from the request, so a
     * consumer that throws leaves the row on the queue instead of losing the
     * event and returning an error to the provider.
     */
    @Transactional
    public int drain() {
        List<PaymentEventModel> pending = events.findUnprocessedBefore(Instant.now());
        int handled = 0;

        for (PaymentEventModel event : pending) {
            try {
                apply(event);
                event.setProcessedAt(Instant.now());
                events.save(event);
                handled++;
            } catch (RuntimeException failure) {
                // Left unprocessed on purpose: the alarm on old unprocessed
                // rows is what surfaces this, and retrying a bad row forever in
                // a loop would only hide it.
                log.error("Could not apply webhook {} ({}): {}",
                        event.getProviderEventId(), event.getEventType(), failure.getMessage());
            }
        }

        return handled;
    }

    /** Rows the provider delivered that nothing here ever acted on. */
    public List<PaymentEventModel> stuck(Instant olderThan) {
        return events.findUnprocessedBefore(olderThan);
    }

    // --- what each event means ---

    private void apply(PaymentEventModel event) {
        JsonNode object = json.readTree(event.getPayload()).path("data").path("object");

        switch (event.getEventType()) {
            case "setup_intent.succeeded" -> registerMethod(object);

            // The card's face: brand, last four, expiry. Arrives around the
            // same time as the setup intent, in no guaranteed order.
            case "payment_method.attached" -> attachMethod(object);

            // The hold went on. This is the confirmation, not the cause — the
            // authorise call already told us — but it is the version to trust.
            case "payment_intent.amount_capturable_updated" ->
                    onIntent(object, PaymentStatus.AUTHORIZED, event);

            case "payment_intent.succeeded" -> onIntent(object, PaymentStatus.CAPTURED, event);

            case "payment_intent.payment_failed" -> onIntent(object, PaymentStatus.FAILED, event);

            case "payment_intent.canceled" -> onIntent(object, PaymentStatus.CANCELLED, event);

            default -> log.debug("No handler for {}, recorded only", event.getEventType());
        }
    }

    private void registerMethod(JsonNode object) {
        String customerId = text(object, "customer");
        String methodToken = text(object, "payment_method");
        String setupIntentId = text(object, "id");

        if (customerId == null || methodToken == null) {
            log.warn("setup_intent.succeeded with no customer or method; ignoring");
            return;
        }

        // Card details are not on the setup intent, so the row starts without
        // them. A payment_method.attached event fills in brand and last4.
        accounts.register(customerId, methodToken, setupIntentId, null, null, null, null);
    }

    private void attachMethod(JsonNode object) {
        String customerId = text(object, "customer");
        String token = text(object, "id");
        if (customerId == null || token == null) {
            return;
        }

        JsonNode card = object.path("card");
        accounts.register(customerId, token, null,
                text(card, "brand"),
                text(card, "last4"),
                shortOrNull(card, "exp_month"),
                shortOrNull(card, "exp_year"));
    }

    private static Short shortOrNull(JsonNode node, String field) {
        JsonNode value = node.path(field);
        return value.isNumber() ? (short) value.asInt() : null;
    }

    private void onIntent(JsonNode object, PaymentStatus status, PaymentEventModel event) {
        String intentId = text(object, "id");
        if (intentId == null) {
            return;
        }

        Optional<PaymentModel> found = payments.findByProviderAndProviderPaymentId(PROVIDER, intentId);
        if (found.isEmpty()) {
            log.warn("Webhook for unknown intent {}", intentId);
            return;
        }

        PaymentModel payment = found.get();
        event.setPaymentId(payment.getId());

        // Providers do not promise order. A CAPTURED payment must not be walked
        // back to AUTHORIZED by a delivery that overtook its own successor.
        if (payment.getStatus().settled() && status != PaymentStatus.CAPTURED) {
            log.debug("Ignoring out-of-order {} for already-captured {}", status, intentId);
            return;
        }

        switch (status) {
            case AUTHORIZED -> {
                payment.markAuthorised(intentId, Instant.now());
                // On the 3-D Secure path this is the only voice that says the
                // hold is real; the order module hears it and moves on.
                publisher.publishEvent(new PaymentAuthorised(payment.getOrderId(), payment.getId()));
            }
            case CAPTURED -> payment.markCaptured(payment.getAmount(), Instant.now());
            case FAILED -> payment.markFailed(
                    text(object.path("last_payment_error"), "code"),
                    text(object.path("last_payment_error"), "message"));
            case CANCELLED -> payment.setStatus(PaymentStatus.CANCELLED);
            default -> { /* nothing else is acted on */ }
        }

        payments.save(payment);
    }

    private static String text(JsonNode node, String field) {
        JsonNode value = node.path(field);
        return value.isMissingNode() || value.isNull() ? null : value.asString();
    }
}
