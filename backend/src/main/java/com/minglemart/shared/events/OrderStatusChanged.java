package com.minglemart.shared.events;

import java.time.Instant;
import java.util.UUID;

import org.springframework.modulith.events.Externalized;

import com.minglemart.shared.enums.OrderStatus;

/**
 * Every move an order makes, for whoever is watching it move.
 *
 * <p>This is what the customer's live tracking renders from. It is deliberately
 * dumb — a transition and a timestamp — because the interesting events above
 * carry the detail and this one only has to arrive quickly and in order.
 */
@Externalized("minglemart.orders::order.status")
public record OrderStatusChanged(
        UUID orderId,
        String orderNumber,
        UUID userId,
        OrderStatus from,
        OrderStatus to,
        String reason,
        Instant at) {
}
