package com.minglemart.shared.events;

import java.math.BigDecimal;
import java.util.UUID;

import org.springframework.modulith.events.Externalized;

/**
 * A picker has been through the order and a moderator signed it off.
 *
 * <p>{@code finalAmount} is what the capture is for: at or below the hold, and
 * not bounded by the original estimate — a heavy cut legitimately costs more
 * than the basket said.
 */
@Externalized("minglemart.orders::order.picked")
public record OrderPicked(
        UUID orderId,
        String orderNumber,
        UUID userId,
        BigDecimal finalAmount,
        String currency) {
}
