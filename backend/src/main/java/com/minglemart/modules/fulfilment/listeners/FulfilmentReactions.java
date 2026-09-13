package com.minglemart.modules.fulfilment.listeners;

import org.springframework.modulith.events.ApplicationModuleListener;
import org.springframework.stereotype.Component;

import com.minglemart.modules.fulfilment.services.PickingService;
import com.minglemart.shared.events.OrderAuthorised;

/**
 * Puts an authorised order on the moderator's board.
 *
 * <p>The hold going on is the signal that picking labour may be spent, so this
 * is the moment the order becomes fulfilment's problem. Cheap enough to run
 * in-process — one row — and idempotent because there is one task per order.
 */
@Component
public class FulfilmentReactions {

    private final PickingService picking;

    public FulfilmentReactions(PickingService picking) {
        this.picking = picking;
    }

    @ApplicationModuleListener
    public void on(OrderAuthorised event) {
        picking.open(event.orderId());
    }
}
