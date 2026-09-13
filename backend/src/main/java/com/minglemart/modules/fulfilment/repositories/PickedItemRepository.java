package com.minglemart.modules.fulfilment.repositories;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.minglemart.modules.fulfilment.models.PickedItemModel;

public interface PickedItemRepository extends JpaRepository<PickedItemModel, UUID> {

    /** One verdict per line, which the schema enforces. */
    Optional<PickedItemModel> findByPickingTaskIdAndOrderItemId(UUID pickingTaskId, UUID orderItemId);

    List<PickedItemModel> findByPickingTaskId(UUID pickingTaskId);

    /**
     * Swaps a customer is being asked about right now, oldest first. A picker is
     * standing in an aisle for every row on this list.
     */
    @Query("""
           select p from PickedItemModel p
           where p.substituteStatus = com.minglemart.shared.enums.SubstituteStatus.PROPOSED
           order by p.substituteProposedAt
           """)
    List<PickedItemModel> findAwaitingAnswer();
}
