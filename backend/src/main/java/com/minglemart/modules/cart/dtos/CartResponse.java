package com.minglemart.modules.cart.dtos;

import java.util.List;
import java.util.UUID;
import java.math.BigDecimal;

import com.minglemart.shared.common.Money;
import com.minglemart.shared.enums.PriceUnit;

public record CartResponse(UUID cartId, List<Line> lines, int itemCount, Money subtotal, boolean hasPriceDrift) {
    public record Line(
        UUID variantId,
        String sku,
        String name,
        String imageUrl,
        BigDecimal quantity,
        PriceUnit quantityUnit,
        Money unitPrice,
        Money currentPrice,
        Money lineTotal,
        Money ceiling,
        boolean estimated,
        boolean unavailable
    ) {
        public boolean priceChanged() {
            return currentPrice != null && currentPrice.amount().compareTo(unitPrice.amount()) != 0;
        }

        public BigDecimal priceDelta() {
            return currentPrice == null ? BigDecimal.ZERO : currentPrice.amount().subtract(unitPrice.amount());
        }
    }

    public static CartResponse empty(UUID cartId, String currency) {
        return new CartResponse(cartId, List.of(), 0, Money.zero(currency), false);
    }
}
