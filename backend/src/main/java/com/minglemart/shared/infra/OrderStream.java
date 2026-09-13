package com.minglemart.shared.infra;

import java.util.Map;
import java.util.UUID;
import java.util.List;
import org.slf4j.Logger;
import java.time.Duration;
import java.io.IOException;
import org.slf4j.LoggerFactory;
import tools.jackson.databind.ObjectMapper;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.Binding;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.stereotype.Component;
import java.util.concurrent.CopyOnWriteArrayList;
import org.springframework.amqp.core.QueueBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.context.annotation.Configuration;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.minglemart.shared.events.OrderStatusChanged;

@Component
@ConditionalOnWebApplication(type = ConditionalOnWebApplication.Type.SERVLET)
public class OrderStream {
    /** How long a browser may hold a stream before reconnecting. */
    private static final Duration TIMEOUT = Duration.ofMinutes(15);

    /** Every transition, which is exactly what live tracking renders. */
    public static final String ROUTING_KEY = "order.status";

    private final Logger log = LoggerFactory.getLogger(getClass());

    /** Local subscribers only. Every instance keeps its own. */
    private final Map<UUID, List<SseEmitter>> byOrder = new ConcurrentHashMap<>();

    private final ObjectMapper json = new ObjectMapper();

    /** Opens a stream for one order. The caller has already checked it is theirs. */
    public SseEmitter open(UUID orderId) {
        SseEmitter emitter = new SseEmitter(TIMEOUT.toMillis());

        byOrder.computeIfAbsent(orderId, key -> new CopyOnWriteArrayList<>()).add(emitter);

        emitter.onCompletion(() -> drop(orderId, emitter));
        emitter.onTimeout(() -> drop(orderId, emitter));
        emitter.onError(failure -> drop(orderId, emitter));

        try {
            emitter.send(SseEmitter.event().name("open").data(orderId.toString()));
        } catch (IOException gone) {
            drop(orderId, emitter);
        }

        return emitter;
    }

    /** Every instance hears every update and keeps the ones it has a browser for. */
    @RabbitListener(queues = "#{orderStreamQueue.name}")
    public void onStatusChanged(String payload) {
        OrderStatusChanged change;
        try {
            change = json.readValue(payload, OrderStatusChanged.class);
        } catch (RuntimeException malformed) {
            log.warn("Dropped an unreadable order update: {}", malformed.getMessage());
            return;
        }

        List<SseEmitter> listeners = byOrder.get(change.orderId());
        if (listeners == null || listeners.isEmpty()) {
            return;
        }

        for (SseEmitter emitter : listeners) {
            try {
                emitter.send(SseEmitter.event().name("status").data(payload));
            } catch (IOException | IllegalStateException gone) {
                drop(change.orderId(), emitter);
            }
        }
    }

    private void drop(UUID orderId, SseEmitter emitter) {
        List<SseEmitter> listeners = byOrder.get(orderId);
        if (listeners == null) {
            return;
        }

        listeners.remove(emitter);
        if (listeners.isEmpty()) {
            byOrder.remove(orderId);
        }
    }

    @Configuration
    static class Topology {

        @Bean
        Queue orderStreamQueue() {
            return QueueBuilder.nonDurable()
                    .exclusive()
                    .autoDelete()
                    .build();
        }

        @Bean
        Binding orderStreamBinding(Queue orderStreamQueue, TopicExchange orderEvents) {
            return BindingBuilder.bind(orderStreamQueue).to(orderEvents).with(ROUTING_KEY);
        }
    }
}
