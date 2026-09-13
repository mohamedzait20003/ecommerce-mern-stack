package com.minglemart.modules.fulfilment.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.minglemart.shared.infra.Queues;

/** The queues fulfilment consumes from. Declared on every instance; see PaymentQueues. */
@Configuration
public class FulfilmentQueues {

    /**
     * An order was called off; put back anything a picker already took. Its
     * own queue on the same routing key payment uses, so a failure putting
     * stock back can never stop the hold being released, or the other way
     * round.
     */
    public static final String UNWIND_PICK = "fulfilment.unwind-pick";

    @Bean
    Queue unwindPickQueue() {
        return Queues.job(UNWIND_PICK);
    }

    @Bean
    Binding unwindPickBinding(Queue unwindPickQueue, TopicExchange orderEvents) {
        return BindingBuilder.bind(unwindPickQueue).to(orderEvents).with("order.cancelled");
    }
}
