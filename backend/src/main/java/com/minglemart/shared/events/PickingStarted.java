package com.minglemart.shared.events;

import java.util.UUID;

import org.springframework.modulith.events.Externalized;

/** A moderator handed the order to a picker. The order is now PROCESSING. */
@Externalized("minglemart.fulfilment::picking.started")
public record PickingStarted(UUID orderId, UUID pickerId, UUID assignedBy) {
}
