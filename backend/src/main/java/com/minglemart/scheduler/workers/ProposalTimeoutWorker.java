package com.minglemart.scheduler.workers;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.minglemart.shared.contracts.FulfilmentOperations;

/**
 * Gives up on substitute proposals nobody answered.
 *
 * <p>Clock-driven because a silent customer produces no event: nothing fires
 * when somebody does not tap "yes". Only a sweep can notice that three minutes
 * have passed, and every proposal it times out is a picker who can move on.
 */
@Component
public class ProposalTimeoutWorker {

    private static final Logger log = LoggerFactory.getLogger(ProposalTimeoutWorker.class);

    private final FulfilmentOperations fulfilment;

    public ProposalTimeoutWorker(FulfilmentOperations fulfilment) {
        this.fulfilment = fulfilment;
    }

    @Scheduled(fixedDelayString = "${minglemart.scheduler.proposals.sweep-interval:30s}")
    public void sweep() {
        int timedOut = fulfilment.timeOutStaleProposals();
        if (timedOut > 0) {
            log.info("Timed out {} unanswered substitute proposal(s)", timedOut);
        }
    }
}
