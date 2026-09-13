package com.minglemart.modules.cart.dtos;

import java.math.BigDecimal;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;

/** Zero is allowed and means "remove the line", so a stepper clicked to nothing needs no special case. */
public record CartQuantityRequest(
        @NotNull(message = "A quantity is required.")
        @DecimalMin(value = "0", message = "Quantity may not be negative.")
        @DecimalMax(value = "99", message = "Quantity may not exceed 99.")
        @Digits(integer = 9, fraction = 3, message = "Quantity may have at most three decimal places.")
        BigDecimal quantity) {
}
