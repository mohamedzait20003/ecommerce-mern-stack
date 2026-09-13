package com.minglemart.modules.catalog.models;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import com.minglemart.shared.domain.BaseModel;
import com.minglemart.shared.enums.ProductStatus;
import com.minglemart.shared.enums.StorageType;
import java.math.BigDecimal;

/**
 * The thing a shopper talks about ("the blue running shoe"). It is never priced
 * and never bought — {@link ProductVariantModel} is.
 *
 * <p>{@code products.search_vector} is deliberately not mapped. It is a
 * {@code tsvector} maintained by a database trigger, so Hibernate has no
 * business writing it; the full-text search lives in a native query on the
 * repository instead.
 */
@Entity
@Table(name = "products")
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class ProductModel extends BaseModel {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private CategoryModel category;

    @Column(nullable = false, unique = true, length = 200)
    private String slug;

    @Column(nullable = false)
    private String name;

    private String description;

    /** Targetable by an offer scoped to a brand, so it is indexed. */
    private String brand;

    /**
     * A percentage of the line, held per product because a grocery basket mixes
     * rates: fresh food is commonly zero-rated where household goods are not.
     * Orders snapshot the rate they were placed under, so editing this never
     * rewrites what an old order was charged.
     */
    @Builder.Default
    @Column(name = "tax_rate", nullable = false, precision = 5, scale = 2)
    private BigDecimal taxRate = BigDecimal.ZERO;

    /**
     * How the product is held, and so what becomes of it when a picked order is
     * abandoned. See {@link StorageType#restockable()} — ambient stock goes back
     * on the shelf, anything chilled or frozen has been out of temperature
     * control by then and is written off.
     */
    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "storage_type", nullable = false, length = 16)
    private StorageType storageType = StorageType.AMBIENT;

    /**
     * Beer, wine, tobacco. A catalogue fact that the DELIVERY has to act on: the
     * driver checks ID at the door, and by then the basket is a sealed bag they
     * cannot inspect, so the answer travels with the delivery rather than being
     * looked up from it.
     */
    @Builder.Default
    @Column(name = "is_age_restricted", nullable = false)
    private boolean ageRestricted = false;

    /** Set exactly when {@link #ageRestricted} is; the schema insists on both or neither. */
    @Column(name = "min_age")
    private Short minAge;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private ProductStatus status = ProductStatus.DRAFT;

    @OneToMany(mappedBy = "product", fetch = FetchType.LAZY,
               cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sku ASC")
    @Builder.Default
    private List<ProductVariantModel> variants = new ArrayList<>();

    @OneToMany(mappedBy = "product", fetch = FetchType.LAZY,
               cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("position ASC")
    @Builder.Default
    private List<ProductImageModel> images = new ArrayList<>();

    public boolean isPublished() {
        return status == ProductStatus.ACTIVE;
    }

    /**
     * The variant to assume when the shopper names the product but not the
     * size — "add the blue shoe". Exactly one is flagged, per
     * {@code ux_variants_default}.
     */
    public Optional<ProductVariantModel> defaultVariant() {
        return variants.stream().filter(ProductVariantModel::isDefaultVariant).findFirst();
    }

    // --- association helpers, so both ends stay in step ---

    public void addVariant(ProductVariantModel variant) {
        variants.add(variant);
        variant.setProduct(this);
    }

    public void addImage(ProductImageModel image) {
        images.add(image);
        image.setProduct(this);
    }
}
