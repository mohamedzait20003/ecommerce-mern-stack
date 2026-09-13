package com.minglemart.modules.order.models;

import java.math.BigDecimal;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import com.minglemart.shared.common.Money;
import com.minglemart.shared.enums.PriceBy;
import com.minglemart.shared.enums.PriceUnit;
import com.minglemart.shared.enums.SellBy;

/**
 * One line of a placed order, snapshotted so it reads correctly forever.
 *
 * <p>The name, price and pricing mode are all copies rather than references: a
 * product delisted or re-listed by the piece next year must not rewrite what
 * this order said. Carries no timestamps of its own — the order it belongs to
 * has them.
 */
@Entity
@Table(name = "order_items")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderItemModel {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private OrderModel order;

    /** Nullable: RESTRICT on the catalogue means a delisted product keeps its history. */
    @Column(name = "variant_id")
    private UUID variantId;

    @Column(name = "sku", nullable = false, length = 64)
    private String sku;

    @Column(name = "product_name", nullable = false)
    private String productName;

    @Column(name = "variant_name", nullable = false)
    private String variantName;

    /** In the selling unit the three snapshot columns below pin down. */
    @Column(name = "quantity", nullable = false, precision = 12, scale = 3)
    private BigDecimal quantity;

    @Column(name = "unit_price_amount", nullable = false, precision = 19, scale = 4)
    private BigDecimal unitPriceAmount;

    /** An estimate wherever {@link #priceBy} is WEIGHT, until the scale says otherwise. */
    @Column(name = "total_amount", nullable = false, precision = 19, scale = 4)
    private BigDecimal totalAmount;

    // ---- how it was sold, as it stood at placement -------------------------

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "sell_by", nullable = false, length = 8)
    private SellBy sellBy = SellBy.EACH;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "price_by", nullable = false, length = 8)
    private PriceBy priceBy = PriceBy.EACH;

    @Enumerated(EnumType.STRING)
    @Column(name = "price_unit", length = 4)
    private PriceUnit priceUnit;

    /**
     * The weight band for the WHOLE line, not for one unit — two chickens at
     * 3.5-4.5 lb each is a line band of 7 to 9 lb. Storing the line total keeps
     * the arithmetic uniform across the two weighed shapes: a counter line's
     * band already folds in the quantity that was asked for, so a catch-weight
     * line folds in its quantity too and nothing downstream has to ask which
     * kind it is looking at.
     *
     * <p>{@code maxWeight} is what the card was held against and what the
     * capture is capped at, so it has to be the figure the shopper was quoted —
     * not whatever the catalogue says today.
     */
    @Column(name = "min_weight", precision = 12, scale = 3)
    private BigDecimal minWeight;

    @Column(name = "max_weight", precision = 12, scale = 3)
    private BigDecimal maxWeight;

    // ---- tax ---------------------------------------------------------------

    @Builder.Default
    @Column(name = "tax_rate", nullable = false, precision = 5, scale = 2)
    private BigDecimal taxRate = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "tax_amount", nullable = false, precision = 19, scale = 4)
    private BigDecimal taxAmount = BigDecimal.ZERO;

    /** Units already sent back. Rare now that nothing is charged before picking. */
    @Builder.Default
    @Column(name = "refunded_quantity", nullable = false, precision = 12, scale = 3)
    private BigDecimal refundedQuantity = BigDecimal.ZERO;

    @Builder.Default
    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "currency", nullable = false, length = 3)
    private String currency = "USD";

    // ---- behaviour ---------------------------------------------------------

    public boolean weighed() {
        return priceBy == PriceBy.WEIGHT;
    }

    /** Per selling unit as quoted — per tin, or per pound. */
    public Money unitPrice() {
        return new Money(unitPriceAmount, currency);
    }

    /**
     * The most this line may ever be billed. For a weighed line that is the top
     * of its band; for anything else it is simply what it costs. Summing this
     * across an order is how {@code authorized_amount} is arrived at.
     */
    public Money ceiling() {
        return weighed()
                ? unitPrice().times(maxWeight)
                : new Money(totalAmount, currency);
    }
}
