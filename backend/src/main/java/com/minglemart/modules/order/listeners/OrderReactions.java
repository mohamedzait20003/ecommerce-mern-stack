package com.minglemart.modules.order.listeners;

import org.springframework.modulith.events.ApplicationModuleListener;
import org.springframework.stereotype.Component;

import com.minglemart.modules.order.services.OrderService;
import com.minglemart.shared.common.ActorRef;
import com.minglemart.shared.enums.OrderStatus;
import com.minglemart.shared.events.OrderDelivered;
import com.minglemart.shared.events.OrderDispatched;
import com.minglemart.shared.events.OrderPaid;
import com.minglemart.shared.events.OrderPaymentFailed;
import com.minglemart.shared.events.PaymentAuthorised;
import com.minglemart.shared.events.PickingStarted;

/**
 * The only writer of {@code orders.status}, and it gets there by listening.
 *
 * <p>Fulfilment says a picker started, a van left, a door opened. Payment says
 * the money was taken or was not. None of them touch the order; they announce,
 * and this moves it. That keeps one module responsible for what an order's
 * status means, and resolves the question of which of two tables is the truth
 * about where an order is: this one, derived from what the others reported.
 *
 * <p>Every reaction is safe to run twice. {@code transition} treats a move to
 * the status the order is already at as a no-op, so a redelivered event
 * changes nothing.
 */
@Component
public class OrderReactions {

    private final OrderService orders;

    public OrderReactions(OrderService orders) {
        this.orders = orders;
    }

    /**
     * Guarded: only a PLACED order moves. On the ordinary path checkout already
     * moved it and this is an echo; on the challenge path this is the first
     * word that the hold is real.
     */
    @ApplicationModuleListener
    public void on(PaymentAuthorised event) {
        orders.authoriseIfPlaced(event.orderId(), ActorRef.SYSTEM);
    }

    @ApplicationModuleListener
    public void on(PickingStarted event) {
        orders.transition(event.orderId(), OrderStatus.PROCESSING,
                "Assigned to a picker.", ActorRef.user(event.assignedBy()));
    }

    @ApplicationModuleListener
    public void on(OrderPaid event) {
        orders.transition(event.orderId(), OrderStatus.PAID,
                "Captured " + event.captured() + " " + event.currency() + ".", ActorRef.SYSTEM);
    }

    @ApplicationModuleListener
    public void on(OrderPaymentFailed event) {
        orders.transition(event.orderId(), OrderStatus.PAYMENT_FAILED,
                event.failureMessage(), ActorRef.SYSTEM);
    }

    @ApplicationModuleListener
    public void on(OrderDispatched event) {
        orders.transition(event.orderId(), OrderStatus.SHIPPED,
                "Out for delivery.", ActorRef.user(event.assignedBy()));
    }

    @ApplicationModuleListener
    public void on(OrderDelivered event) {
        orders.transition(event.orderId(), OrderStatus.DELIVERED,
                event.receivedBy() == null ? "Delivered." : "Received by " + event.receivedBy() + ".",
                ActorRef.user(event.driverId()));
    }
}
