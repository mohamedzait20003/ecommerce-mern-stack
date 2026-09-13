package com.minglemart.shared.events;

import java.util.UUID;

import org.springframework.modulith.events.Externalized;

/** Somebody took the bags. The order is done. */
@Externalized("minglemart.fulfilment::order.delivered")
public record OrderDelivered(UUID orderId, UUID driverId, String receivedBy) {
}
