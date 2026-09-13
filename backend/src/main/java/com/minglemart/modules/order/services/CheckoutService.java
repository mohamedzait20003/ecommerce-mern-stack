package com.minglemart.modules.order.services;

import java.util.UUID;

import org.springframework.stereotype.Service;

import com.minglemart.modules.order.dtos.CheckoutRequest;
import com.minglemart.shared.common.ActorRef;
import com.minglemart.shared.common.Money;
import com.minglemart.shared.contracts.OrderOperations;
import com.minglemart.shared.contracts.PaymentOperations;
import com.minglemart.shared.contracts.UserDirectory;
import com.minglemart.shared.enums.OrderStatus;
import com.minglemart.shared.enums.PaymentStatus;

/**
 * Turning a basket into an order with a hold on a card, while the shopper is
 * still looking at the screen.
 *
 * <p>Deliberately NOT one transaction. Placement commits, then the provider is
 * called, then the status moves — three commits — because the call to Stripe
 * must never sit inside a database transaction. A slow provider would hold
 * locks; a provider that succeeded just as the transaction rolled back would
 * leave a hold on a card for an order that does not exist. Each step is
 * idempotent instead: the same key placed twice finds the first order, the
 * same key authorised twice finds the first hold.
 */
@Service
public class CheckoutService {

    private final OrderService orders;
    private final PaymentOperations payments;
    private final UserDirectory users;

    public CheckoutService(OrderService orders, PaymentOperations payments, UserDirectory users) {
        this.orders = orders;
        this.payments = payments;
        this.users = users;
    }

    /**
     * @return the order number, and the provider's client secret if the
     *         cardholder still has to answer a challenge
     */
    public Outcome checkout(UUID userId, CheckoutRequest request) {
        ActorRef actor = ActorRef.user(userId);

        // Both preconditions before anything is written: with nothing charged
        // at checkout, these two are all that stands between a picked order
        // and a customer who cannot pay for it.
        UUID addressId = resolveAddress(userId, request.deliveryAddressId());
        if (!payments.canPay(userId)) {
            throw new IllegalStateException("Add a payment card before placing an order.");
        }

        OrderOperations.OrderSummary placed = orders.place(new OrderOperations.PlaceOrder(
                userId,
                payments.billingAccountId(userId).orElse(null),
                request.deliverySpeed(),
                request.deliveryWindowStart(),
                addressId,
                request.customerNote(),
                request.idempotencyKey(),
                actor));

        // A retried request that found its earlier order, already moved on.
        if (placed.status() != OrderStatus.PLACED) {
            return new Outcome(placed.orderNumber(), null);
        }

        Money hold = placed.hold().orElseThrow(() ->
                new IllegalStateException("The order was placed without a figure to hold."));

        PaymentOperations.PaymentResult result;
        try {
            result = payments.authorize(new PaymentOperations.AuthorizeOrder(
                    placed.id(), userId, hold, "auth:" + placed.id(), actor));
        } catch (RuntimeException declined) {
            // The card said no, with the shopper right there to hear it. The
            // order ends before a picker ever sees it, and the message they
            // read is the provider's reason, not a stack trace.
            orders.transition(placed.id(), OrderStatus.CANCELLED,
                    "Card declined at checkout: " + declined.getMessage(), actor);
            throw new IllegalStateException("Your card was declined. " + declined.getMessage(), declined);
        }

        if (result.status() == PaymentStatus.AUTHORIZED) {
            orders.authoriseIfPlaced(placed.id(), actor);
        }
        // REQUIRES_ACTION: the order stays PLACED. The browser completes the
        // challenge, the provider's webhook confirms the hold, and
        // OrderReactions moves it. Nothing to do here but hand back the secret.

        return new Outcome(placed.orderNumber(), result.clientSecret());
    }

    private UUID resolveAddress(UUID userId, UUID requested) {
        if (requested == null) {
            return users.defaultAddressId(userId).orElseThrow(() ->
                    new IllegalStateException("Add a delivery address before placing an order."));
        }
        if (!users.ownsAddress(userId, requested)) {
            throw new IllegalArgumentException("That address is not one of yours.");
        }
        return requested;
    }

    public record Outcome(String orderNumber, String clientSecret) {
    }
}
