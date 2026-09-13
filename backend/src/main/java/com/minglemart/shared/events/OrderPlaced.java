package com.minglemart.shared.events;

import java.math.BigDecimal;
import java.util.UUID;

import org.springframework.modulith.events.Externalized;

/**
 * A basket became a promise. Nothing is held yet — that is the next step, and
 * it is the one that can fail.
 */
@Externalized("minglemart.orders::order.placed")
public record OrderPlaced(
        UUID orderId,
        String orderNumber,
        UUID userId,
        BigDecimal estimate,
        BigDecimal toAuthorise,
        String currency
) {}
