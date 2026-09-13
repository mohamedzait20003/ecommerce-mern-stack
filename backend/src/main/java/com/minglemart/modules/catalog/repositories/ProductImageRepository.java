package com.minglemart.modules.catalog.repositories;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.minglemart.modules.catalog.models.ProductImageModel;

/**
 * Extends {@code JpaRepository} rather than {@code BaseRepository}:
 * {@code product_images} records {@code created_at} but no {@code updated_at},
 * so the entity does not extend {@code BaseModel}.
 */
public interface ProductImageRepository extends JpaRepository<ProductImageModel, UUID> {

    List<ProductImageModel> findByProductIdOrderByPositionAsc(UUID productId);

    /** Variant-specific shots, for when a colour swatch swaps the gallery. */
    List<ProductImageModel> findByVariantIdOrderByPositionAsc(UUID variantId);

    /**
     * Images for a whole grid in one query. Fetching the lead image per card
     * separately is the N+1 that makes a 12-tile page twelve round trips.
     */
    List<ProductImageModel> findByProductIdInOrderByPositionAsc(Collection<UUID> productIds);

    /**
     * Lead image URLs for one variant, best first.
     *
     * A variant-specific shot outranks the product's own, which is the whole
     * point of one — a colour swatch showing the default photo would be lying.
     * Written as a single ordered query rather than "look for a variant image,
     * then fall back", because that pays for a guaranteed miss on every product
     * whose images are attached at product level, which is most of them.
     */
    @Query("""
            select image.url
            from ProductImageModel image
            where image.product.id = :productId
              and (image.variant.id = :variantId or image.variant is null)
            order by case when image.variant.id = :variantId then 0 else 1 end asc,
                     image.position asc
            """)
    List<String> findLeadImageUrls(@Param("productId") UUID productId, @Param("variantId") UUID variantId);
}
