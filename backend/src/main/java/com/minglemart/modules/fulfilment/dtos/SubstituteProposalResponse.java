package com.minglemart.modules.fulfilment.dtos;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import com.minglemart.modules.fulfilment.models.PickedItemModel;

/**
 * A swap the picker is offering, as the customer sees it while deciding. The
 * names come from the catalogue at render time; the price is what was offered
 * — and what they pay is never more than the line it replaces, whatever this
 * says.
 */
public record SubstituteProposalResponse(
        UUID pickedItemId,
        UUID orderItemId,
        String originalName,
        UUID substituteVariantId,
        String substituteName,
        BigDecimal substituteUnitPrice,
        Instant proposedAt) {

    public static SubstituteProposalResponse from(PickedItemModel item, String originalName, String substituteName) {
        return new SubstituteProposalResponse(
                item.getId(),
                item.getOrderItemId(),
                originalName,
                item.getSubstituteVariantId(),
                substituteName,
                item.getSubstituteUnitPriceAmount(),
                item.getSubstituteProposedAt());
    }
}
