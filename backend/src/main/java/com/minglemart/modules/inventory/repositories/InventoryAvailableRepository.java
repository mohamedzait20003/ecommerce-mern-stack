package com.minglemart.modules.inventory.repositories;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.minglemart.modules.inventory.models.InventoryAvailableView;

/** Read-only: the view has no writable table behind these rows. */
public interface InventoryAvailableRepository extends JpaRepository<InventoryAvailableView, UUID> {

    List<InventoryAvailableView> findByVariantIdIn(Collection<UUID> variantIds);
}
