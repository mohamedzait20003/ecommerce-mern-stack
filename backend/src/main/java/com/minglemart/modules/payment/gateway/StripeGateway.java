package com.minglemart.modules.payment.gateway;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.minglemart.shared.common.Money;
import com.stripe.StripeClient;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import com.stripe.model.Customer;
import com.stripe.model.Event;
import com.stripe.model.PaymentIntent;
import com.stripe.model.Refund;
import com.stripe.model.SetupIntent;
import com.stripe.net.RequestOptions;
import com.stripe.net.Webhook;
import com.stripe.param.CustomerCreateParams;
import com.stripe.param.PaymentIntentCaptureParams;
import com.stripe.param.PaymentIntentCreateParams;
import com.stripe.param.RefundCreateParams;
import com.stripe.param.SetupIntentCreateParams;

/**
 * Everything this system asks of Stripe, and nothing else.
 *
 * <p>There is no interface in front of this. There is one payment provider and
 * no plan for a second, and an abstraction over a single implementation is a
 * layer that has to be read and kept honest without ever being used. If a
 * second provider ever arrives, extracting the interface then will be a smaller
 * job than maintaining a speculative one until it does.
 *
 * <p>Two details carry most of the design. {@code CaptureMethod.MANUAL} is what
 * separates holding money from taking it — without it there is no gap for a
 * picker to work in. And amounts cross this boundary in minor units, because
 * Stripe counts in cents and a rounding mistake at this seam is a rounding
 * mistake in somebody's bank account.
 */
@Component
public class StripeGateway {

    private static final BigDecimal MINOR_UNITS = new BigDecimal("100");

    private final StripeClient stripe;
    private final String webhookSecret;

    public StripeGateway(@Value("${minglemart.stripe.secret-key:}") String secretKey,
                         @Value("${minglemart.stripe.webhook-secret:}") String webhookSecret) {
        this.stripe = new StripeClient(secretKey);
        this.webhookSecret = webhookSecret;
    }

    public String createCustomer(String email, String name, Map<String, String> metadata) {
        try {
            Customer customer = stripe.customers().create(
                    CustomerCreateParams.builder()
                            .setEmail(email)
                            .setName(name)
                            .putAllMetadata(metadata == null ? Map.of() : metadata)
                            .build());
            return customer.getId();
        } catch (StripeException failure) {
            throw translate("Could not open a billing account.", failure);
        }
    }

    public SetupSession startMethodSetup(String customerId) {
        try {
            // usage=off_session is the whole point: it records that the
            // cardholder agreed to be charged later, when they will not be here
            // to agree again.
            SetupIntent intent = stripe.setupIntents().create(
                    SetupIntentCreateParams.builder()
                            .setCustomer(customerId)
                            .setUsage(SetupIntentCreateParams.Usage.OFF_SESSION)
                            .build());

            return new SetupSession(intent.getId(), intent.getClientSecret());
        } catch (StripeException failure) {
            throw translate("Could not start card setup.", failure);
        }
    }

    public Authorization authorize(AuthorizeRequest request) {
        try {
            PaymentIntent intent = stripe.paymentIntents().create(
                    PaymentIntentCreateParams.builder()
                            .setAmount(minorUnits(request.amount()))
                            .setCurrency(request.amount().currency().toLowerCase())
                            .setCustomer(request.customerId())
                            .setPaymentMethod(request.paymentMethodToken())
                            // Hold, do not take. The gap between the two is
                            // where a picker walks the store.
                            .setCaptureMethod(PaymentIntentCreateParams.CaptureMethod.MANUAL)
                            .setConfirm(true)
                            .putAllMetadata(request.metadata() == null ? Map.of() : request.metadata())
                            .build(),
                    idempotent(request.idempotencyKey()));

            return new Authorization(intent.getId(), intent.getStatus(), intent.getClientSecret());
        } catch (StripeException failure) {
            throw translate("The card could not be authorised.", failure);
        }
    }

    public Capture capture(String providerPaymentId, Money amount) {
        try {
            PaymentIntent captured = stripe.paymentIntents().capture(
                    providerPaymentId,
                    PaymentIntentCaptureParams.builder()
                            .setAmountToCapture(minorUnits(amount))
                            .build());

            return new Capture(captured.getId(), captured.getStatus());
        } catch (StripeException failure) {
            throw translate("The payment could not be captured.", failure);
        }
    }

    public void releaseHold(String providerPaymentId) {
        try {
            stripe.paymentIntents().cancel(providerPaymentId);
        } catch (StripeException failure) {
            throw translate("The hold could not be released.", failure);
        }
    }

    public RefundReceipt refund(String providerPaymentId, Money amount, String idempotencyKey) {
        try {
            Refund refund = stripe.refunds().create(
                    RefundCreateParams.builder()
                            .setPaymentIntent(providerPaymentId)
                            .setAmount(minorUnits(amount))
                            .build(),
                    idempotent(idempotencyKey));

            return new RefundReceipt(refund.getId(), refund.getStatus());
        } catch (StripeException failure) {
            throw translate("The refund could not be sent.", failure);
        }
    }

    public WebhookEvent verify(String rawBody, String signatureHeader) {
        try {
            // The RAW body, byte for byte. Parsing and re-serialising it first
            // changes the bytes and the signature stops matching, which is the
            // classic way this check gets quietly disabled.
            Event event = Webhook.constructEvent(rawBody, signatureHeader, webhookSecret);
            return new WebhookEvent(event.getId(), event.getType(), rawBody);
        } catch (SignatureVerificationException failure) {
            throw new SignatureException("This webhook was not signed by Stripe.", failure);
        }
    }

    // ---- internals ------------------------------------------------------------

    private static RequestOptions idempotent(String key) {
        return key == null
                ? RequestOptions.builder().build()
                : RequestOptions.builder().setIdempotencyKey(key).build();
    }

    /** Stripe counts in cents; we count in decimals. This is the only seam. */
    private static long minorUnits(Money money) {
        return money.amount()
                .multiply(MINOR_UNITS)
                .setScale(0, RoundingMode.HALF_UP)
                .longValueExact();
    }

    private static PaymentException translate(String message, StripeException failure) {
        return new PaymentException(message, failure.getCode(), failure);
    }

    // ---- what a caller passes in and gets back --------------------------------

    public record AuthorizeRequest(
        String customerId,
        String paymentMethodToken,
        Money amount,
        /** The caller's own reference, so a retry cannot double-hold. */
        String idempotencyKey,
        Map<String, String> metadata
    ) {}

    public record SetupSession(String setupIntentId, String clientSecret) {}

    /**
     * {@code clientSecret} is non-null only when the issuer wants the
     * cardholder to answer something. Because this happens at checkout the
     * shopper is still there to answer it.
     */
    public record Authorization(String providerPaymentId, String status, String clientSecret) {}

    public record Capture(String providerPaymentId, String status) {}

    public record RefundReceipt(String providerRefundId, String status) {}

    /** {@code payload} is the raw body, kept verbatim for the inbox row. */
    public record WebhookEvent(String id, String type, String payload) {}

    /** A body that did not come from Stripe, or came from a replayed one. */
    public static class SignatureException extends RuntimeException {
        public SignatureException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
