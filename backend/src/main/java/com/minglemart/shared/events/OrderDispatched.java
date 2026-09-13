package com.minglemart.shared.events;

import java.util.UUID;

import org.springframework.modulith.events.Externalized;

/** A moderator put the picked order on a van. The order is now SHIPPED. */
@Externalized("minglemart.fulfilment::order.dispatched")
public record OrderDispatched(UUID orderId, UUID driverId, UUID assignedBy) {
}
