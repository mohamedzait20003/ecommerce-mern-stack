package com.minglemart.modules.catalog.models;

import java.math.BigDecimal;
import java.util.LinkedHashSet;
import java.util.Set;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import com.minglemart.shared.common.Money;
import com.minglemart.shared.domain.BaseModel;
import com.minglemart.shared.enums.NetContentUnit;
import com.minglemart.shared.enums.PriceBy;
import com.minglemart.shared.enums.PriceUnit;
import com.minglemart.shared.enums.SellBy;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;

/**
 * The thing that is actually priced, stocked and bought (size 42, blue).
 * Everything downstream — cart, order, inventory — references this, never
 * {@link ProductModel}.
 *
 * <p>{@link #priceAmount} is the LIST price and does not move when a sale
 * starts. What a shopper actually pays is the list price with the best live
 * offer applied, which is read from {@link VariantPriceView}.
 */
@Entity
@Table(name = "product_variants")
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class ProductVariantModel extends BaseModel {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private ProductModel product;

    @Column(nullable = false, unique = true, length = 64)
    private String sku;

    @Column(nullable = false)
    private String name;

    @Column(name = "price_amount", nullable = false, precision = 19, scale = 4)
    private BigDecimal priceAmount;

    @Builder.Default
    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(nullable = false, length = 3)
    private String currency = "USD";

    /**
     * The nominal weight of one unit. Doubles as the shipping weight and as the
     * figure a catch-weight line is priced from at checkout, before anything
     * has been near a scale.
     */
    private Integer weightGrams;

    // ---- how this is bought and priced ------------------------------------
    // Two independent questions, not one. A grocery basket mixes three shapes:
    //
    //   tin of beans   sell EACH   price EACH     count it, price per tin
    //   whole chicken  sell EACH   price WEIGHT   count it, price per pound
    //   deli turkey    sell WEIGHT price WEIGHT   ask for 0.5 lb, price per pound
    //
    // The middle row is why the two cannot be collapsed into one enum.

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "sell_by", nullable = false, length = 8)
    private SellBy sellBy = SellBy.EACH;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "price_by", nullable = false, length = 8)
    private PriceBy priceBy = PriceBy.EACH;

    /** The unit {@code priceAmount} is quoted in. Null unless priced by weight. */
    @Enumerated(EnumType.STRING)
    @Column(name = "price_unit", length = 4)
    private PriceUnit priceUnit;

    /**
     * Catch weight only: the band one unit comes in — "3.5 to 4.5 lb". Nobody
     * knows which bird until it is weighed, so {@code maxWeight} is what
     * checkout authorises the card against.
     */
    @Column(name = "min_weight", precision = 12, scale = 3)
    private BigDecimal minWeight;

    @Column(name = "max_weight", precision = 12, scale = 3)
    private BigDecimal maxWeight;

    /**
     * Sold by weight only: how far over the asked-for weight a cut may be
     * BILLED. Ask for 0.5 lb at 10% and the ceiling is 0.55 lb — the slicer may
     * hand over more and often will, but the customer is charged for 0.55.
     * That cap is what keeps a capture inside its authorisation.
     */
    @Column(name = "pick_tolerance_pct", precision = 5, scale = 2)
    private BigDecimal pickTolerancePct;

    /**
     * What is in the package, for the shelf-edge unit price ("$0.42/oz"). Kept
     * apart from the pricing columns because a tin is priced per tin and still
     * has to display a price per ounce.
     */
    @Column(name = "net_content", precision = 12, scale = 3)
    private BigDecimal netContent;

    @Enumerated(EnumType.STRING)
    @Column(name = "net_content_unit", length = 6)
    private NetContentUnit netContentUnit;

    /** Mapped to {@code is_default}; exactly one per product carries it. */
    @Builder.Default
    @Column(name = "is_default", nullable = false)
    private boolean defaultVariant = false;

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @OneToMany(mappedBy = "variant", fetch = FetchType.LAZY,
               cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private Set<VariantAttributeModel> attributes = new LinkedHashSet<>();

    /** The list price as money. Not what the shopper pays if an offer applies. */
    public Money listPrice() {
        return new Money(priceAmount, currency);
    }

    public void addAttribute(String name, String value) {
        attributes.add(VariantAttributeModel.builder()
                .variant(this)
                .name(name)
                .value(value)
                .build());
    }
}
