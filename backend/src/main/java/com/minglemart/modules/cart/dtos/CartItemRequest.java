package com.minglemart.modules.cart.dtos;

import java.util.UUID;
import java.math.BigDecimal;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;


/**
 * Quantity is in the variant's selling unit: {@code 2} tins, or {@code 0.5} of
 * a pound of sliced ham. Three decimals, matching the column.
 */
public record CartItemRequest(
        @NotNull(message = "A variant is required.")
        UUID variantId,

        @NotNull(message = "A quantity is required.")
        @DecimalMin(value = "0.001", message = "Quantity must be more than zero.")
        @DecimalMax(value = "99", message = "Quantity may not exceed 99.")
        @Digits(integer = 9, fraction = 3, message = "Quantity may have at most three decimal places.")
        BigDecimal quantity
) {}
