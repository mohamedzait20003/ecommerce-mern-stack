package com.minglemart.shared.contracts;

import java.util.List;
import java.util.UUID;
import java.math.BigDecimal;

import com.minglemart.shared.common.Money;
import com.minglemart.shared.common.ActorRef;
import com.minglemart.shared.enums.PriceUnit;

public interface CartOperations {
    CartSummary currentCart(UUID userId);

    CartSummary addItem(UUID userId, UUID variantId, BigDecimal quantity, ActorRef actor);

    CartSummary updateQuantity(UUID userId, UUID variantId, BigDecimal quantity, ActorRef actor);

    CartSummary removeItem(UUID userId, UUID variantId, ActorRef actor);

    record CartLine(
        UUID variantId,
        String sku,
        String name,
        BigDecimal quantity,
        PriceUnit quantityUnit,
        Money unitPrice,
        Money lineTotal
    ) {}

    record CartSummary(
        UUID cartId,
        List<CartLine> lines,
        Money total
    ) {}
}
