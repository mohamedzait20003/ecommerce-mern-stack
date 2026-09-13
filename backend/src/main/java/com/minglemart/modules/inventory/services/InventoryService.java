package com.minglemart.modules.inventory.services;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minglemart.modules.inventory.models.InventoryAvailableView;
import com.minglemart.modules.inventory.models.InventoryItemModel;
import com.minglemart.modules.inventory.models.StockMovementModel;
import com.minglemart.modules.inventory.repositories.InventoryAvailableRepository;
import com.minglemart.modules.inventory.repositories.InventoryItemRepository;
import com.minglemart.modules.inventory.repositories.StockMovementRepository;
import com.minglemart.shared.common.ActorRef;
import com.minglemart.shared.contracts.StockLedger;

/**
 * The only thing that moves stock.
 *
 * <p>Every adjustment goes through {@link #apply}, which writes the shelf and
 * the ledger row explaining it inside one transaction. Nothing else in the
 * codebase touches {@code quantity_on_hand}, which is what makes the ledger a
 * complete account of the shelf rather than a partial one.
 */
@Service
@Transactional(readOnly = true)
public class InventoryService implements StockLedger {

    private final InventoryItemRepository items;
    private final InventoryAvailableRepository available;
    private final StockMovementRepository movements;

    public InventoryService(InventoryItemRepository items,
                            InventoryAvailableRepository available,
                            StockMovementRepository movements) {
        this.items = items;
        this.available = available;
        this.movements = movements;
    }

    @Override
    public BigDecimal availableQuantity(UUID variantId) {
        return available.findById(variantId)
                .map(InventoryAvailableView::getQuantityAvailable)
                .orElse(BigDecimal.ZERO);
    }

    @Override
    public Map<UUID, BigDecimal> availableQuantities(Collection<UUID> variantIds) {
        if (variantIds.isEmpty()) {
            return Map.of();
        }

        return available.findByVariantIdIn(variantIds).stream()
                .collect(Collectors.toMap(
                        InventoryAvailableView::getVariantId,
                        InventoryAvailableView::getQuantityAvailable));
    }

    @Override
    @Transactional
    public void apply(StockChange change) {
        requireSensible(change);

        // Locked before it is read, not after: two pickers reaching for the same
        // variant would otherwise both read the old figure and both write their
        // own, quietly losing one of the movements.
        InventoryItemModel item = items.findForUpdate(change.variantId())
                .orElseGet(() -> items.save(InventoryItemModel.builder()
                        .variantId(change.variantId())
                        .build()));

        BigDecimal after = item.getQuantityOnHand().add(change.quantityDelta());
        if (after.signum() < 0 && !item.isAllowBackorder()) {
            throw new IllegalStateException(
                    "Taking %s would leave %s at %s, and it does not allow backorder."
                            .formatted(change.quantityDelta().abs(), change.variantId(), after));
        }

        item.setQuantityOnHand(after);

        ActorRef actor = change.actor() == null ? ActorRef.SYSTEM : change.actor();
        movements.save(StockMovementModel.builder()
                .variantId(change.variantId())
                .quantityDelta(change.quantityDelta())
                .reason(change.reason())
                .referenceType(change.referenceType())
                .referenceId(change.referenceId())
                .actorType(actor.type())
                .actorUserId(actor.userId())
                .note(change.note())
                .build());
    }

    /** Stock levels that have fallen to where somebody should be reordering. */
    public List<InventoryItemModel> needingReorder() {
        return items.findNeedingReorder();
    }

    private static void requireSensible(StockChange change) {
        if (change.quantityDelta() == null || change.quantityDelta().signum() == 0) {
            throw new IllegalArgumentException("A stock movement of zero explains nothing.");
        }

        if (!change.reason().permits(change.quantityDelta().signum())) {
            throw new IllegalArgumentException(
                    "%s cannot be recorded with a delta of %s."
                            .formatted(change.reason(), change.quantityDelta()));
        }
    }
}
