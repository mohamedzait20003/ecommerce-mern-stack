package com.minglemart.shared.events;

import java.math.BigDecimal;
import java.util.UUID;

import org.springframework.modulith.events.Externalized;

/** The money is taken. From here the order only has to reach a door. */
@Externalized("minglemart.orders::order.paid")
public record OrderPaid(
        UUID orderId,
        String orderNumber,
        UUID userId,
        BigDecimal captured,
        String currency) {
}
