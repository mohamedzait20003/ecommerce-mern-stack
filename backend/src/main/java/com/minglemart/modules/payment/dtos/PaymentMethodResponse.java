package com.minglemart.modules.payment.dtos;

import java.util.UUID;

import com.minglemart.modules.payment.models.PaymentMethodModel;
import com.minglemart.shared.enums.PaymentMethodType;

/**
 * A stored card as the settings screen shows it. {@code usable} is the one
 * that matters at checkout: a card that was never confirmed for later charges
 * is listed, but cannot hold an order.
 */
public record PaymentMethodResponse(
        UUID id,
        PaymentMethodType type,
        String brand,
        String last4,
        Short expMonth,
        Short expYear,
        boolean isDefault,
        boolean usable,
        String label) {

    public static PaymentMethodResponse from(PaymentMethodModel method) {
        return new PaymentMethodResponse(
                method.getId(),
                method.getMethodType(),
                method.getBrand(),
                method.getLast4(),
                method.getExpMonth(),
                method.getExpYear(),
                method.isDefaultMethod(),
                method.usable(),
                method.describe());
    }
}
