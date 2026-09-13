package com.minglemart.shared.events;

import java.util.UUID;

import org.springframework.modulith.events.Externalized;

import com.minglemart.shared.enums.OrderStatus;

/**
 * The order is off.
 *
 * <p>{@code wasAt} matters more than it looks: cancelled from AUTHORIZED means
 * releasing a hold and nothing else, while cancelled from PROCESSING or later
 * means a picker may already have taken goods off a shelf that now have to go
 * back — or be written off, if they were chilled.
 */
@Externalized("minglemart.orders::order.cancelled")
public record OrderCancelled(
        UUID orderId,
        String orderNumber,
        UUID userId,
        OrderStatus wasAt,
        String reason) {
}
