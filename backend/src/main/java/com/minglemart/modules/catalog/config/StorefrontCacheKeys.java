package com.minglemart.modules.catalog.config;

import java.util.List;
import java.time.Duration;
import java.math.BigDecimal;

import com.minglemart.modules.catalog.dtos.ShopSort;


public final class StorefrontCacheKeys {
    public static final String PREFIX = "storefront:";

    public static final String CATEGORY_TILES = PREFIX + "categories:tiles";
    public static final String CATEGORY_FACETS = PREFIX + "categories:facets";
    public static final String TRENDING = PREFIX + "trending";
    public static final String DEAL_OF_THE_DAY = PREFIX + "hero";
    public static final String DEALS = PREFIX + "deals";
    private static final String SHOP = PREFIX + "shop:";

    public static final Duration CATEGORIES_TTL = Duration.ofMinutes(10);
    public static final Duration TRENDING_TTL = Duration.ofMinutes(5);

    /** The hero carries a countdown and an allocation that moves as people buy. */
    public static final Duration DEAL_OF_THE_DAY_TTL = Duration.ofMinutes(2);

    /** Shortest of them all: "only 4 left" is the most perishable number here. */
    public static final Duration DEALS_TTL = Duration.ofSeconds(45);

    /** Longest: product data changes when a merchandiser acts, and that evicts. */
    public static final Duration SHOP_TTL = Duration.ofMinutes(5);

    private StorefrontCacheKeys() {
    }

    public static String shop(String query, List<String> categories, BigDecimal minPrice, BigDecimal maxPrice, BigDecimal minRating, ShopSort sort, int page, int size) {

        return SHOP + String.join("|",
            or(query),
            categories == null || categories.isEmpty() ? "-" : String.join(",", categories),
            or(minPrice),
            or(maxPrice),
            or(minRating),
            sort.name(),
            Integer.toString(page),
            Integer.toString(size)
        );
    }

    private static String or(Object value) {
        return value == null ? "-" : value.toString();
    }
}
