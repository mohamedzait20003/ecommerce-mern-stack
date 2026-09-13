package com.minglemart.shared.infra;

import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.QueueBuilder;

/**
 * The names modules and the platform agree on, and the one shape every job
 * queue takes.
 *
 * <p>Here rather than in {@code shared.config} because modules declare their
 * own queues and need these to do it; the config package is the platform's
 * wiring and is internal to the kernel. This is the seam between the two: the
 * exchanges and dead-letter topology are declared once in
 * {@code MessagingConfig}, and modules bind to them by these names.
 */
public final class Queues {

    /** Exchanges domain events are externalised onto. */
    public static final String ORDERS = "minglemart.orders";
    public static final String FULFILMENT = "minglemart.fulfilment";

    /**
     * Where a job's message goes after its last retry. Laravel's failed_jobs:
     * moved, not dropped, so somebody can read it, fix the cause and put it
     * back.
     */
    public static final String DEAD_LETTER_EXCHANGE = "minglemart.dlx";
    public static final String DEAD_LETTERS = "minglemart.dead-letters";

    private Queues() {
    }

    /**
     * A durable job queue that dead-letters. Durable, because a message lost
     * in a broker restart is work nobody did; dead-lettered, because a message
     * that keeps failing should be read, not spun.
     */
    public static Queue job(String name) {
        return QueueBuilder.durable(name)
                .deadLetterExchange(DEAD_LETTER_EXCHANGE)
                .build();
    }
}
