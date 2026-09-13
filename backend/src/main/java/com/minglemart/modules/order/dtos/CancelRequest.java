package com.minglemart.modules.order.dtos;

import jakarta.validation.constraints.Size;

/** Optional. The reason lands on the status trail, where support will read it. */
public record CancelRequest(@Size(max = 300, message = "Keep the reason under 300 characters.") String reason) {
}
