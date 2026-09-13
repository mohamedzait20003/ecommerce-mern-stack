package com.minglemart.shared.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.FanoutExchange;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.QueueBuilder;
import org.springframework.amqp.core.TopicExchange;

import com.minglemart.shared.infra.Queues;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * The exchanges domain events are externalised onto.
 *
 * <p>Declared here rather than left to be created implicitly, so a broker
 * restarted with a clean volume comes back up with the topology this system
 * expects instead of silently dropping the first messages published to it.
 *
 * <p>Topic exchanges, one per module that owns events, matching the
 * {@code @Externalized("exchange::routing.key")} declarations in
 * {@code shared.events}. A consumer binds to the keys it cares about —
 * {@code order.*} for everything an order does, or
 * {@code order.payment-failed} for the one queue a person has to watch.
 *
 * <p>Durable, because an event that survives its transaction should survive a
 * broker restart too; the transactional outbox would otherwise be guaranteeing
 * delivery to something that forgets.
 */
@Configuration
public class MessagingConfig {

    public static final String ORDERS = Queues.ORDERS;
    public static final String FULFILMENT = Queues.FULFILMENT;

    @Bean
    TopicExchange orderEvents() {
        return new TopicExchange(ORDERS, true, false);
    }

    @Bean
    TopicExchange fulfilmentEvents() {
        return new TopicExchange(FULFILMENT, true, false);
    }

    // ---- dead letters ----------------------------------------------------

    public static final String DEAD_LETTER_EXCHANGE = Queues.DEAD_LETTER_EXCHANGE;
    public static final String DEAD_LETTERS = Queues.DEAD_LETTERS;

    @Bean
    FanoutExchange deadLetterExchange() {
        return new FanoutExchange(DEAD_LETTER_EXCHANGE, true, false);
    }

    @Bean
    Queue deadLetters() {
        return QueueBuilder.durable(DEAD_LETTERS).build();
    }

    @Bean
    Binding deadLettersBinding(Queue deadLetters, FanoutExchange deadLetterExchange) {
        return BindingBuilder.bind(deadLetters).to(deadLetterExchange);
    }

}
