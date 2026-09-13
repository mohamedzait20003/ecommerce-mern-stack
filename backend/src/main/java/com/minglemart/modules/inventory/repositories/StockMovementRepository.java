package com.minglemart.modules.inventory.repositories;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.minglemart.modules.inventory.models.StockMovementModel;

public interface StockMovementRepository extends JpaRepository<StockMovementModel, UUID> {

    /** The ledger for one variant, newest first — matches ix_stock_movements_variant. */
    Page<StockMovementModel> findByVariantIdOrderByCreatedAtDesc(UUID variantId, Pageable pageable);

    /** Everything one pick or one order caused, for tracing a discrepancy back. */
    List<StockMovementModel> findByReferenceTypeAndReferenceIdOrderByCreatedAt(String referenceType, UUID referenceId);
}
