package com.minglemart.modules.order.services;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.minglemart.shared.enums.DeliverySpeed;

/**
 * The rules about when a delivery may be booked for.
 *
 * <p>These live in Java rather than in a CHECK constraint because they depend
 * on two things a constraint cannot see: the time the order was placed, and
 * where the store is. The database enforces the SHAPE — express carries no
 * window, standard carries exactly one exactly two hours wide, and nothing may
 * be booked more than 48 hours out — and this enforces the rest.
 */
@Component
public class DeliverySlots {

    private final ZoneId storeZone;

    public DeliverySlots(@Value("${minglemart.store.timezone:America/New_York}") String storeZone) {
        this.storeZone = ZoneId.of(storeZone);
    }

    /**
     * Rejects a window the store cannot honour. Called at placement, against
     * the moment the order is being placed.
     *
     * @throws IllegalArgumentException with a message meant for the shopper
     */
    public void validate(DeliverySpeed speed, Instant windowStart, Instant placedAt) {
        if (!speed.booksAWindow()) {
            if (windowStart != null) {
                throw new IllegalArgumentException("Express delivery does not take a time slot.");
            }
            return;
        }

        if (windowStart == null) {
            throw new IllegalArgumentException("Choose a delivery slot.");
        }

        if (windowStart.isBefore(placedAt.plus(DeliverySpeed.LEAD_TIME))) {
            throw new IllegalArgumentException(
                    "The earliest slot is %d hours from now.".formatted(DeliverySpeed.LEAD_TIME.toHours()));
        }

        ZonedDateTime start = windowStart.atZone(storeZone);
        ZonedDateTime ends = start.plus(DeliverySpeed.WINDOW);

        // The window has to finish before the store does, so a slot that starts
        // at 21:00 is no good however early it was booked.
        if (ends.getHour() > DeliverySpeed.LAST_HOUR
                || (ends.getHour() == DeliverySpeed.LAST_HOUR && ends.getMinute() > 0)
                || !ends.toLocalDate().equals(start.toLocalDate())) {
            throw new IllegalArgumentException(
                    "Deliveries finish at %d:00.".formatted(DeliverySpeed.LAST_HOUR));
        }

        // Today or tomorrow, in the store's own days rather than the shopper's.
        LocalDate today = placedAt.atZone(storeZone).toLocalDate();
        LocalDate booked = start.toLocalDate();
        if (booked.isAfter(today.plusDays(1))) {
            throw new IllegalArgumentException("Slots are only open for today and tomorrow.");
        }
    }

    /** A bookable window. */
    public record Slot(Instant start, Instant end) {
    }

    /**
     * Every window a shopper may pick right now: today and tomorrow, starting
     * on the hour, two hours wide, no earlier than three hours out and no
     * later than closing. Generated from the same constants
     * {@link #validate} checks against, so what is offered is exactly what is
     * accepted.
     */
    public List<Slot> available(Instant now) {
        ZonedDateTime earliest = now.plus(DeliverySpeed.LEAD_TIME).atZone(storeZone);
        ZonedDateTime firstStart = earliest.truncatedTo(ChronoUnit.HOURS);
        if (firstStart.isBefore(earliest)) {
            firstStart = firstStart.plusHours(1);
        }

        LocalDate today = now.atZone(storeZone).toLocalDate();
        List<Slot> slots = new ArrayList<>();

        for (LocalDate day : List.of(today, today.plusDays(1))) {
            ZonedDateTime open = day.atTime(DeliverySpeed.FIRST_HOUR, 0).atZone(storeZone);
            ZonedDateTime lastStart = day.atTime(DeliverySpeed.LAST_HOUR, 0).atZone(storeZone)
                    .minus(DeliverySpeed.WINDOW);

            for (ZonedDateTime start = open; !start.isAfter(lastStart); start = start.plusHours(1)) {
                if (start.isBefore(firstStart)) {
                    continue;
                }
                slots.add(new Slot(start.toInstant(), start.plus(DeliverySpeed.WINDOW).toInstant()));
            }
        }

        return slots;
    }

    /** The end of a window that starts here. Exactly two hours, as the schema insists. */
    public Instant endFor(Instant windowStart) {
        return windowStart == null ? null : windowStart.plus(DeliverySpeed.WINDOW);
    }

    /** How long until a hold taken now would be at risk, for the staleness alarm. */
    public Duration authorisationHeadroom() {
        return Duration.ofDays(1);
    }
}
