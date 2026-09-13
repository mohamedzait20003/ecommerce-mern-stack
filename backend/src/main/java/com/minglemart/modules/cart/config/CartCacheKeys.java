package com.minglemart.modules.cart.config;

import java.util.UUID;
import java.time.Duration;

public final class CartCacheKeys {
    public static final String PREFIX = "cart:";

    private static final String USER = PREFIX + "user:";

    public static final Duration CART_TTL = Duration.ofMinutes(2);

    private CartCacheKeys() {
    }

    public static String forUser(UUID userId) {
        return USER + userId;
    }
}
