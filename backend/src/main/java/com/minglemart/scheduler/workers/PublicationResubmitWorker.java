package com.minglemart.scheduler.workers;

import java.time.Duration;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.modulith.events.IncompleteEventPublications;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Re-runs in-process listeners that failed and never completed.
 *
 * <p>An {@code @ApplicationModuleListener} that throws leaves its row in
 * {@code event_publication} without a completion date. Restart replays those;
 * this catches the ones that got stuck while the process stayed up. Together
 * they are the in-process equivalent of a dead-letter queue — except the
 * "queue" is a table you can read, and re-running is one method call.
 *
 * <p>Only publications older than a few minutes, so a listener that is simply
 * still running is left alone.
 */
@Component
public class PublicationResubmitWorker {

    private static final Logger log = LoggerFactory.getLogger(PublicationResubmitWorker.class);

    private static final Duration STUCK_AFTER = Duration.ofMinutes(5);

    private final IncompleteEventPublications publications;

    public PublicationResubmitWorker(IncompleteEventPublications publications) {
        this.publications = publications;
    }

    @Scheduled(fixedDelayString = "${minglemart.scheduler.publications.resubmit-interval:2m}")
    public void resubmit() {
        publications.resubmitIncompletePublicationsOlderThan(STUCK_AFTER);
        log.debug("Resubmitted event publications older than {}", STUCK_AFTER);
    }
}
