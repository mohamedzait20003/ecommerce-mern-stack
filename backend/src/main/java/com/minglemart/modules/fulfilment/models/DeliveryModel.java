package com.minglemart.modules.fulfilment.models;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import com.minglemart.shared.domain.BaseModel;
import com.minglemart.shared.enums.DeliveryStatus;

/**
 * Getting the bags to the door.
 *
 * <p>The promised window is COPIED here at dispatch rather than joined from the
 * order at read time, so the driver is held to what was actually promised even
 * if the order is edited afterwards.
 *
 * <p>{@code ageCheckRequired} travels with the delivery for the same reason a
 * driver cannot look it up: by the time they are at the door the basket is a
 * sealed bag they cannot inspect.
 */
@Entity
@Table(name = "deliveries")
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class DeliveryModel extends BaseModel {

    @Column(name = "order_id", nullable = false, unique = true, updatable = false)
    private UUID orderId;

    /** Null exactly when UNASSIGNED. */
    @Column(name = "driver_id")
    private UUID driverId;

    @Column(name = "assigned_by")
    private UUID assignedBy;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 16)
    private DeliveryStatus status = DeliveryStatus.UNASSIGNED;

    @Column(name = "promised_window_start")
    private Instant promisedWindowStart;

    @Column(name = "promised_window_end")
    private Instant promisedWindowEnd;

    @Column(name = "received_by")
    private String receivedBy;

    @Column(name = "proof_note")
    private String proofNote;

    @Builder.Default
    @Column(name = "age_check_required", nullable = false)
    private boolean ageCheckRequired = false;

    @Column(name = "id_verified_at")
    private Instant idVerifiedAt;

    @Column(name = "assigned_at")
    private Instant assignedAt;

    @Column(name = "collected_at")
    private Instant collectedAt;

    @Column(name = "delivered_at")
    private Instant deliveredAt;

    @OneToMany(mappedBy = "delivery", fetch = FetchType.LAZY,
               cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<DeliveryAttemptModel> attempts = new ArrayList<>();

    public void add(DeliveryAttemptModel attempt) {
        attempts.add(attempt);
        attempt.setDelivery(this);
    }

    /** Attempt numbers are dense and start at one; the schema keeps them unique. */
    public int nextAttemptNumber() {
        return attempts.size() + 1;
    }

    /** Whether the door can be opened at all, given what is in the bag. */
    public boolean mayHandOver() {
        return !ageCheckRequired || idVerifiedAt != null;
    }

    public boolean late(Instant now) {
        return promisedWindowEnd != null && status.open() && now.isAfter(promisedWindowEnd);
    }
}
