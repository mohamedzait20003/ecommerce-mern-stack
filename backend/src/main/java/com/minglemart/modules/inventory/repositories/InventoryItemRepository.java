package com.minglemart.modules.inventory.repositories;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;

import com.minglemart.modules.inventory.models.InventoryItemModel;

public interface InventoryItemRepository extends JpaRepository<InventoryItemModel, UUID> {

    /**
     * Takes a row lock before the shelf is adjusted. Two pickers reaching for
     * the same variant at the same moment would otherwise both read the old
     * quantity and both write their own answer, losing one of the movements.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select i from InventoryItemModel i where i.variantId = :variantId")
    Optional<InventoryItemModel> findForUpdate(@Param("variantId") UUID variantId);

    List<InventoryItemModel> findByVariantIdIn(Collection<UUID> variantIds);

    /** The reorder report: everything at or below its threshold. */
    @Query("""
           select i from InventoryItemModel i
           where i.quantityOnHand - i.quantityReserved <= i.reorderLevel
           """)
    List<InventoryItemModel> findNeedingReorder();
}
