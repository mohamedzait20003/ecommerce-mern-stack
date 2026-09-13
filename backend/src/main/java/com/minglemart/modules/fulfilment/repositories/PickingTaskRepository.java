package com.minglemart.modules.fulfilment.repositories;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.minglemart.modules.fulfilment.models.PickingTaskModel;
import com.minglemart.shared.domain.BaseRepository;
import com.minglemart.shared.enums.PickingTaskStatus;

public interface PickingTaskRepository extends BaseRepository<PickingTaskModel> {

    /** One task per order, which the schema enforces. */
    Optional<PickingTaskModel> findByOrderId(UUID orderId);

    @Query("""
           select t from PickingTaskModel t
           left join fetch t.pickedItems
           where t.id = :id
           """)
    Optional<PickingTaskModel> findWithItems(@Param("id") UUID id);

    /** The moderator's board, oldest first — matches ix_picking_tasks_open. */
    List<PickingTaskModel> findByStatusInOrderByCreatedAt(Collection<PickingTaskStatus> statuses);

    /** One picker's own list. */
    List<PickingTaskModel> findByPickerIdAndStatusInOrderByAssignedAt(
            UUID pickerId, Collection<PickingTaskStatus> statuses);
}
