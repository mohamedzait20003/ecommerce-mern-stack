package com.minglemart.shared.contracts;

import java.util.Map;
import java.util.UUID;
import java.math.BigDecimal;
import java.util.Collection;

import com.minglemart.shared.common.ActorRef;
import com.minglemart.shared.enums.MovementReason;

public interface StockLedger {
    BigDecimal availableQuantity(UUID variantId);

    /** One query for a whole pick list, rather than one per line. */
    Map<UUID, BigDecimal> availableQuantities(Collection<UUID> variantIds);

    void apply(StockChange change);

    record StockChange(
        UUID variantId,
        BigDecimal quantityDelta,
        MovementReason reason,
        String referenceType,
        UUID referenceId,
        ActorRef actor,
        String note
    ) {
        public static StockChange picked(
            UUID variantId,
            BigDecimal quantity,
            UUID pickingTaskId,
            ActorRef actor
        ) {
            return new StockChange(
                variantId,
                quantity.negate(),
                MovementReason.FULFILMENT,
                "PICK",
                pickingTaskId,
                actor,
                null
            );
        }

        public static StockChange returnedToShelf(
            UUID variantId,
            BigDecimal quantity,
            UUID orderId,
            ActorRef actor,
            String note
        ) {
            return new StockChange(
                variantId,
                quantity,
                MovementReason.RESTOCK,
                "ORDER",
                orderId,
                actor,
                note
            );
        }


        public static StockChange writtenOff(
            UUID variantId,
            BigDecimal quantity,
            UUID orderId,
            ActorRef actor,
            String note
        ) {
            return new StockChange(
                variantId,
                quantity.negate(),
                MovementReason.DAMAGE,
                "ORDER",
                orderId,
                actor,
                note
            );
        }
    }
}
