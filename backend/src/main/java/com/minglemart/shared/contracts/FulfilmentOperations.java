package com.minglemart.shared.contracts;

import java.util.UUID;

import com.minglemart.shared.common.ActorRef;

/**
 * What the outside is allowed to ask of picking and delivery.
 *
 * <p>Small on purpose. Staff drive fulfilment through its own controllers; this
 * exists for the one thing another part of the system has to be able to cause
 * — undoing a pick nobody is coming for.
 */
public interface FulfilmentOperations {

    /**
     * Puts a picked-but-abandoned order back.
     *
     * <p>Every line that left the shelf goes back on it as a RESTOCK. Lines that
     * were chilled or frozen have been out of temperature control by now, so
     * they are immediately written off again as DAMAGE: the shelf nets to where
     * it started, and the ledger tells the truth — picked, returned, thrown
     * away — instead of leaving waste recorded as a sale.
     *
     * <p>A no-op when nothing was picked, so it is safe to call on any cancelled
     * order without first asking whether it got that far.
     *
     * @return how many lines were put back
     */
    int unwindPick(UUID orderId, ActorRef actor);

    /**
     * Gives up on substitute proposals nobody answered. A picker cannot wait
     * in an aisle indefinitely; past the patience window the line is simply
     * unavailable. Clock-driven, because silence produces no event to react to.
     *
     * @return how many proposals were timed out
     */
    int timeOutStaleProposals();
}
