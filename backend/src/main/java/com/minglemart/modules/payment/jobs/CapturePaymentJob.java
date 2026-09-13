package com.minglemart.modules.payment.jobs;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import tools.jackson.databind.ObjectMapper;

import com.minglemart.modules.payment.config.PaymentQueues;
import com.minglemart.modules.payment.services.PaymentService;
import com.minglemart.shared.common.ActorRef;
import com.minglemart.shared.common.Money;
import com.minglemart.shared.contracts.PaymentOperations;
import com.minglemart.shared.enums.PaymentStatus;
import com.minglemart.shared.events.OrderPaid;
import com.minglemart.shared.events.OrderPaymentFailed;
import com.minglemart.shared.events.OrderPicked;

/**
 * Takes the money once a pick is confirmed.
 *
 * <p>The one job that talks to Stripe, and the reason the web tier never
 * consumes this queue: a capture is an outbound call with its own latency and
 * its own failure modes, and none of that belongs on a request thread.
 *
 * <p>Safe to run twice. The capture is keyed on the order, so a redelivery
 * after a success finds the payment already captured and announces it again
 * rather than charging again — and the order module treats a second
 * {@link OrderPaid} for an order already at PAID as a no-op.
 */
@Component
public class CapturePaymentJob {

    private final Logger log = LoggerFactory.getLogger(getClass());

    private final PaymentService payments;
    private final ApplicationEventPublisher events;
    private final ObjectMapper json = new ObjectMapper();

    public CapturePaymentJob(PaymentService payments, ApplicationEventPublisher events) {
        this.payments = payments;
        this.events = events;
    }

    @RabbitListener(queues = PaymentQueues.CAPTURE_PAYMENT, autoStartup = "${minglemart.jobs.enabled:true}")
    @Transactional
    public void handle(String payload) {
        OrderPicked picked = json.readValue(payload, OrderPicked.class);
        Money amount = new Money(picked.finalAmount(), picked.currency());

        try {
            PaymentOperations.PaymentResult result = payments.capture(
                new PaymentOperations.CaptureOrder(picked.orderId(), amount, "capture:" + picked.orderId(), ActorRef.SYSTEM)
            );

            if (result.status() == PaymentStatus.CAPTURED) {
                events.publishEvent(
                    new OrderPaid(picked.orderId(), picked.orderNumber(), picked.userId(), amount.amount(), amount.currency())
                );

            } else {
                events.publishEvent(new OrderPaymentFailed(
                    picked.orderId(), picked.orderNumber(), picked.userId(),
                    "unexpected_status", "Capture returned " + result.status()
                ));
            }

        } catch (RuntimeException declined) {
            log.warn("Capture for order {} failed: {}", picked.orderNumber(), declined.getMessage());
            events.publishEvent(new OrderPaymentFailed(
                picked.orderId(), picked.orderNumber(), picked.userId(),
                "capture_failed", declined.getMessage()
            ));
        }
    }
}
