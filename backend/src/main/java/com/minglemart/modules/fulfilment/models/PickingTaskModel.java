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
import com.minglemart.shared.enums.PickingTaskStatus;

/**
 * One order, one picker, one walk around the store.
 *
 * <p>{@code order_id} is UNIQUE: a single store has nothing to split a pick
 * across. That assumption is load-bearing — a second site breaks it, along with
 * the matching constraint on deliveries.
 *
 * <p>That the picker holds the PICKER role is checked by the service. A CHECK
 * constraint cannot reach across to {@code users.role_id}, so the database only
 * guarantees the weaker and more important thing: assigned and unassigned
 * cannot disagree with whether anybody is holding it.
 */
@Entity
@Table(name = "picking_tasks")
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class PickingTaskModel extends BaseModel {

    @Column(name = "order_id", nullable = false, unique = true, updatable = false)
    private UUID orderId;

    /** Null exactly when UNASSIGNED. */
    @Column(name = "picker_id")
    private UUID pickerId;

    /** The moderator who handed it over. */
    @Column(name = "assigned_by")
    private UUID assignedBy;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 16)
    private PickingTaskStatus status = PickingTaskStatus.UNASSIGNED;

    @Column(name = "note")
    private String note;

    @Column(name = "assigned_at")
    private Instant assignedAt;

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @OneToMany(mappedBy = "pickingTask", fetch = FetchType.LAZY,
               cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<PickedItemModel> pickedItems = new ArrayList<>();

    public void add(PickedItemModel item) {
        pickedItems.add(item);
        item.setPickingTask(this);
    }

    /** Whether anything is still waiting on the customer to answer. */
    public boolean waitingOnCustomer() {
        return pickedItems.stream().anyMatch(PickedItemModel::awaitingAnswer);
    }
}
