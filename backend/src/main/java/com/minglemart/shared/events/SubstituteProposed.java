package com.minglemart.shared.events;

import java.math.BigDecimal;
import java.util.UUID;

import org.springframework.modulith.events.Externalized;

/**
 * A picker is standing at a shelf waiting for an answer.
 *
 * <p>The most time-sensitive message this system sends. It has to reach the
 * customer in seconds, not minutes — email cannot carry a decision somebody is
 * physically waiting on, which is why this is the event that decides whether
 * push notifications are optional.
 */
@Externalized("minglemart.fulfilment::substitute.proposed")
public record SubstituteProposed(
        UUID orderId,
        UUID pickedItemId,
        UUID userId,
        String originalName,
        String substituteName,
        BigDecimal substituteUnitPrice,
        String currency) {
}
