package com.minglemart.modules.fulfilment.jobs;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import tools.jackson.databind.ObjectMapper;

import com.minglemart.modules.fulfilment.config.FulfilmentQueues;
import com.minglemart.modules.fulfilment.services.PickingService;
import com.minglemart.shared.common.ActorRef;
import com.minglemart.shared.events.OrderCancelled;

/**
 * Puts back what a picker took, when the order they took it for is called off.
 *
 * <p>Runs for every cancellation and is a no-op for most of them — an order
 * cancelled from AUTHORIZED was never picked. It is here for the ones that
 * were: the capture that failed, the customer who called it off mid-pick.
 * Per line, the goods go back on the shelf or in the bin depending on how
 * they are stored.
 */
@Component
public class UnwindPickJob {

    private final Logger log = LoggerFactory.getLogger(getClass());

    private final PickingService picking;
    private final ObjectMapper json = new ObjectMapper();

    public UnwindPickJob(PickingService picking) {
        this.picking = picking;
    }

    @RabbitListener(queues = FulfilmentQueues.UNWIND_PICK, autoStartup = "${minglemart.jobs.enabled:true}")
    @Transactional
    public void handle(String payload) {
        OrderCancelled cancelled = json.readValue(payload, OrderCancelled.class);

        int lines = picking.unwindPick(cancelled.orderId(), ActorRef.SYSTEM);
        if (lines > 0) {
            log.info("Put {} line(s) back for cancelled order {}", lines, cancelled.orderNumber());
        }
    }
}
