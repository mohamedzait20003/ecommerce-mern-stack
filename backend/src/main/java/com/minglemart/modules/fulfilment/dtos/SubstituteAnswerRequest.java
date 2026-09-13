package com.minglemart.modules.fulfilment.dtos;

import jakarta.validation.constraints.NotNull;

/** Yes or no. There is no third answer, and silence becomes no on its own. */
public record SubstituteAnswerRequest(@NotNull(message = "Accept or decline the swap.") Boolean accepted) {
}
