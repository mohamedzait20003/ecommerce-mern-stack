package com.minglemart.modules.fulfilment.services;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityNotFoundException;

import com.minglemart.modules.fulfilment.models.DeliveryAttemptModel;
import com.minglemart.modules.fulfilment.models.DeliveryModel;
import com.minglemart.modules.fulfilment.repositories.DeliveryAttemptRepository;
import com.minglemart.modules.fulfilment.repositories.DeliveryRepository;
import com.minglemart.shared.domain.BaseDataService;
import com.minglemart.shared.enums.DeliveryAttemptOutcome;
import com.minglemart.shared.enums.DeliveryStatus;
import com.minglemart.shared.events.OrderDelivered;
import com.minglemart.shared.events.OrderDispatched;

/**
 * Getting the bags to the door, and writing down what happened there.
 *
 * <p>The rule that shapes this class: nobody answering the door is one failed
 * ATTEMPT, not a failed delivery. Attempts append against a single delivery
 * row, so a second knock never erases the first — which is what a customer
 * dispute and a driver's record both depend on.
 */
@Service
public class DeliveryService extends BaseDataService<DeliveryModel, DeliveryRepository> {

    /** Knocks before the goods come back to the store. */
    public static final int MAX_ATTEMPTS = 3;

    private final DeliveryAttemptRepository attempts;
    private final ApplicationEventPublisher events;

    public DeliveryService(DeliveryRepository repository,
                           DeliveryAttemptRepository attempts,
                           ApplicationEventPublisher events) {
        super(repository);
        this.attempts = attempts;
        this.events = events;
    }

    @Override
    protected String entityName() {
        return "Delivery";
    }

    // --- the board ---

    public List<DeliveryModel> open() {
        return repository.findByStatusInOrderByPromisedWindowStart(
                List.of(DeliveryStatus.UNASSIGNED, DeliveryStatus.ASSIGNED,
                        DeliveryStatus.COLLECTED, DeliveryStatus.IN_TRANSIT));
    }

    public List<DeliveryModel> runFor(UUID driverId) {
        return repository.findByDriverIdAndStatusInOrderByPromisedWindowStart(
                driverId, List.of(DeliveryStatus.ASSIGNED, DeliveryStatus.COLLECTED,
                        DeliveryStatus.IN_TRANSIT));
    }

    /**
     * Still out, past what was promised. Express orders never appear here
     * because they carry no window — the gap in reporting that giving express
     * an SLA would close.
     */
    public List<DeliveryModel> late() {
        return repository.findLate(Instant.now(),
                List.of(DeliveryStatus.ASSIGNED, DeliveryStatus.COLLECTED, DeliveryStatus.IN_TRANSIT));
    }

    // --- dispatch ---

    /**
     * A moderator puts a picked order on a van.
     *
     * <p>The promised window is copied in rather than looked up later, so the
     * driver is held to what the shopper was actually told even if the order
     * changes afterwards. So is the age check: at the door the basket is a
     * sealed bag, and the driver cannot inspect what is in it.
     */
    @Transactional
    public DeliveryModel dispatch(UUID orderId, UUID driverId, UUID moderatorId,
                                  Instant windowStart, Instant windowEnd, boolean ageCheckRequired) {
        DeliveryModel delivery = repository.findByOrderId(orderId)
                .orElseGet(() -> DeliveryModel.builder().orderId(orderId).build());

        delivery.setDriverId(driverId);
        delivery.setAssignedBy(moderatorId);
        delivery.setStatus(DeliveryStatus.ASSIGNED);
        delivery.setAssignedAt(Instant.now());
        delivery.setPromisedWindowStart(windowStart);
        delivery.setPromisedWindowEnd(windowEnd);
        delivery.setAgeCheckRequired(ageCheckRequired);

        DeliveryModel saved = repository.save(delivery);
        events.publishEvent(new OrderDispatched(orderId, driverId, moderatorId));
        return saved;
    }

    @Transactional
    public DeliveryModel collect(UUID deliveryId, UUID driverId) {
        DeliveryModel delivery = requireHeldBy(deliveryId, driverId);
        delivery.setStatus(DeliveryStatus.COLLECTED);
        delivery.setCollectedAt(Instant.now());
        return repository.save(delivery);
    }

    @Transactional
    public DeliveryModel setOff(UUID deliveryId, UUID driverId) {
        DeliveryModel delivery = requireHeldBy(deliveryId, driverId);
        delivery.setStatus(DeliveryStatus.IN_TRANSIT);
        return repository.save(delivery);
    }

    /** The driver checked ID at the door. Required before age-restricted goods change hands. */
    @Transactional
    public DeliveryModel verifyAge(UUID deliveryId, UUID driverId) {
        DeliveryModel delivery = requireHeldBy(deliveryId, driverId);
        delivery.setIdVerifiedAt(Instant.now());
        return repository.save(delivery);
    }

    // --- the door ---

    /**
     * Records one knock and moves the delivery on accordingly.
     *
     * <p>A delivery ends in one of three ways: it arrives, it is refused, or it
     * runs out of attempts. Everything else is another try, against the same
     * row, with the earlier attempts still on it.
     */
    @Transactional
    public DeliveryModel recordAttempt(UUID deliveryId, UUID driverId,
                                       DeliveryAttemptOutcome outcome,
                                       String receivedBy, String note) {
        DeliveryModel delivery = repository.findWithAttempts(deliveryId)
                .orElseThrow(() -> new EntityNotFoundException("No such delivery."));
        requireDriver(delivery, driverId);

        if (delivery.getStatus().finished()) {
            throw new IllegalStateException("That delivery is already " + delivery.getStatus() + ".");
        }

        if (outcome == DeliveryAttemptOutcome.DELIVERED && !delivery.mayHandOver()) {
            throw new IllegalStateException(
                    "This order contains age-restricted items. Check ID before handing it over.");
        }

        DeliveryAttemptModel attempt = DeliveryAttemptModel.builder()
                .attemptNo(delivery.nextAttemptNumber())
                .driverId(driverId)
                .outcome(outcome)
                .note(note)
                .build();
        delivery.add(attempt);
        attempts.save(attempt);

        switch (outcome) {
            case DELIVERED -> {
                delivery.setStatus(DeliveryStatus.DELIVERED);
                delivery.setDeliveredAt(Instant.now());
                delivery.setReceivedBy(receivedBy);
                delivery.setProofNote(note);
                events.publishEvent(new OrderDelivered(delivery.getOrderId(), driverId, receivedBy));
            }
            // They were there and said no. Nothing is gained by knocking again.
            case REFUSED -> delivery.setStatus(DeliveryStatus.RETURNED);

            default -> {
                if (delivery.getAttempts().size() >= MAX_ATTEMPTS) {
                    delivery.setStatus(DeliveryStatus.FAILED);
                } else {
                    delivery.setStatus(DeliveryStatus.ASSIGNED);
                }
            }
        }

        return repository.save(delivery);
    }

    /** Goods that came back to the store, whatever the reason. */
    @Transactional
    public DeliveryModel returnToStore(UUID deliveryId, String note) {
        DeliveryModel delivery = repository.findById(deliveryId)
                .orElseThrow(() -> new EntityNotFoundException("No such delivery."));

        delivery.setStatus(DeliveryStatus.RETURNED);
        delivery.setProofNote(note);
        return repository.save(delivery);
    }

    // --- internals ---

    private DeliveryModel requireHeldBy(UUID deliveryId, UUID driverId) {
        DeliveryModel delivery = repository.findById(deliveryId)
                .orElseThrow(() -> new EntityNotFoundException("No such delivery."));
        requireDriver(delivery, driverId);
        return delivery;
    }

    private static void requireDriver(DeliveryModel delivery, UUID driverId) {
        if (delivery.getDriverId() == null || !delivery.getDriverId().equals(driverId)) {
            throw new IllegalStateException("That delivery is assigned to somebody else.");
        }
    }
}
