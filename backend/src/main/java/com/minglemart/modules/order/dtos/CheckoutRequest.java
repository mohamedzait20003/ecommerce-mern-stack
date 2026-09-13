package com.minglemart.modules.order.dtos;

import java.time.Instant;
import java.util.UUID;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import com.minglemart.shared.enums.DeliverySpeed;

/**
 * Everything the shopper decides at checkout. The basket itself is not here —
 * it is whatever their cart holds when this arrives.
 *
 * <p>{@code deliveryAddressId} null means "my default". {@code idempotencyKey}
 * is what stops a double-click, or a retried agent call, producing two orders:
 * the browser generates one per checkout attempt and sends the same value on
 * every retry of that attempt.
 */
public record CheckoutRequest(
        UUID deliveryAddressId,

        @NotNull(message = "Choose standard or express delivery.")
        DeliverySpeed deliverySpeed,

        /** The start of a two-hour window. Required for standard, forbidden for express. */
        Instant deliveryWindowStart,

        @Size(max = 500, message = "Keep the note under 500 characters.")
        String customerNote,

        @Size(max = 128)
        String idempotencyKey) {
}
