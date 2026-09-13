package com.minglemart.modules.payment.jobs;

import tools.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.amqp.rabbit.annotation.RabbitListener;

import com.minglemart.shared.common.ActorRef;
import com.minglemart.shared.events.OrderCancelled;
import com.minglemart.modules.payment.config.PaymentQueues;
import com.minglemart.modules.payment.services.PaymentService;

@Component
public class ReleaseHoldJob {

    private final PaymentService payments;
    private final ObjectMapper json = new ObjectMapper();

    public ReleaseHoldJob(PaymentService payments) {
        this.payments = payments;
    }

    @RabbitListener(queues = PaymentQueues.RELEASE_HOLD, autoStartup = "${minglemart.jobs.enabled:true}")
    @Transactional
    public void handle(String payload) {
        OrderCancelled cancelled = json.readValue(payload, OrderCancelled.class);
        payments.releaseHold(cancelled.orderId(), cancelled.reason(), ActorRef.SYSTEM);
    }
}
