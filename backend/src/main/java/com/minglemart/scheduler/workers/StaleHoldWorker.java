package com.minglemart.scheduler.workers;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.minglemart.shared.contracts.OrderOperations;

/**
 * Notices orders that have been sitting on a card hold for too long.
 *
 * <p>This flow is same-day. An order still AUTHORIZED or PROCESSING a day
 * later means a moderator never assigned it, or a picker claimed it and
 * walked away — and card authorisations lapse after about a week, at which
 * point the capture fails against goods already bagged. Nothing fires when an
 * order turns a day old, so this is a sweep.
 */
@Component
public class StaleHoldWorker {

    private static final Logger log = LoggerFactory.getLogger(StaleHoldWorker.class);

    private static final Duration STALE_AFTER = Duration.ofHours(24);

    private final OrderOperations orders;

    public StaleHoldWorker(OrderOperations orders) {
        this.orders = orders;
    }

    @Scheduled(fixedDelayString = "${minglemart.scheduler.holds.sweep-interval:10m}")
    public void sweep() {
        List<OrderOperations.OrderSummary> stale = orders.findStaleHolds(Instant.now().minus(STALE_AFTER));
        if (stale.isEmpty()) {
            return;
        }

        log.error("ALARM: {} order(s) on a card hold for over {}: {}",
                stale.size(), STALE_AFTER,
                stale.stream().map(OrderOperations.OrderSummary::orderNumber).toList());
    }
}
