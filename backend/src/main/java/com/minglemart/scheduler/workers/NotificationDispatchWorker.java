package com.minglemart.scheduler.workers;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.scheduling.annotation.Scheduled;

import com.minglemart.shared.contracts.NotificationDispatch;
import com.minglemart.scheduler.services.NotificationDeliveryService;

@Component
public class NotificationDispatchWorker {

    private static final Logger log = LoggerFactory.getLogger(NotificationDispatchWorker.class);

    private static final int BATCH_SIZE = 50;
    private static final int RETRY_BATCH_SIZE = 25;

    private final NotificationDispatch dispatch;
    private final NotificationDeliveryService delivery;

    public NotificationDispatchWorker(NotificationDispatch dispatch, NotificationDeliveryService delivery) {
        this.dispatch = dispatch;
        this.delivery = delivery;
    }

    @Scheduled(fixedDelayString = "${minglemart.scheduler.notifications.dispatch-interval:15s}")
    public void dispatch() {
        List<NotificationDispatch.Deliverable> batch = dispatch.claimPending(BATCH_SIZE);

        if (batch.isEmpty()) {
            return;
        }

        int sent = 0;
        for (NotificationDispatch.Deliverable message : batch) {
            if (delivery.deliver(message)) {
                sent++;
            }
        }

        log.info("dispatched {}/{} notification(s)", sent, batch.size());
    }

    @Scheduled(fixedDelayString = "${minglemart.scheduler.notifications.retry-interval:5m}")
    public void retry() {
        int requeued = dispatch.requeueFailed(RETRY_BATCH_SIZE);

        if (requeued > 0) {
            log.info("re-queued {} failed notification(s)", requeued);
        }
    }
}
