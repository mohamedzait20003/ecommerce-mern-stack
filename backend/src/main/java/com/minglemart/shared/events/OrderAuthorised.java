package com.minglemart.shared.events;

import java.math.BigDecimal;
import java.util.UUID;

import org.springframework.modulith.events.Externalized;

/**
 * The card carries a hold, so the order is safe to spend picking labour on.
 * This is the signal a moderator's board waits for.
 */
@Externalized("minglemart.orders::order.authorised")
public record OrderAuthorised(
        UUID orderId,
        String orderNumber,
        UUID userId,
        BigDecimal held,
        String currency) {
}
