package com.minglemart.modules.payment.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.minglemart.shared.infra.Queues;

/**
 * The queues payment consumes from.
 *
 * <p>Declared on EVERY instance, not only the ones that consume. A queue that
 * exists only while a worker is running would drop every event published
 * while the worker was down — the exchange has nowhere to put them. Declaring
 * here means an API instance starting first still creates the queues, and the
 * messages wait for a worker.
 */
@Configuration
public class PaymentQueues {

    /** A pick was confirmed; take the money. */
    public static final String CAPTURE_PAYMENT = "payment.capture";

    /** An order was called off; give the hold back. */
    public static final String RELEASE_HOLD = "payment.release-hold";

    @Bean
    Queue capturePaymentQueue() {
        return Queues.job(CAPTURE_PAYMENT);
    }

    @Bean
    Binding capturePaymentBinding(Queue capturePaymentQueue, TopicExchange orderEvents) {
        return BindingBuilder.bind(capturePaymentQueue).to(orderEvents).with("order.picked");
    }

    @Bean
    Queue releaseHoldQueue() {
        return Queues.job(RELEASE_HOLD);
    }

    @Bean
    Binding releaseHoldBinding(Queue releaseHoldQueue, TopicExchange orderEvents) {
        return BindingBuilder.bind(releaseHoldQueue).to(orderEvents).with("order.cancelled");
    }
}
