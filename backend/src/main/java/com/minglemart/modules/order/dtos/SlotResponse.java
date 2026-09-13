package com.minglemart.modules.order.dtos;

import java.time.Instant;

import com.minglemart.modules.order.services.DeliverySlots;

/** One bookable window, as the checkout page lists them. */
public record SlotResponse(Instant start, Instant end) {

    public static SlotResponse from(DeliverySlots.Slot slot) {
        return new SlotResponse(slot.start(), slot.end());
    }
}
