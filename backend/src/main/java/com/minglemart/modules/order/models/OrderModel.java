package com.minglemart.modules.order.models;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
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

import com.minglemart.shared.common.ActorType;
import com.minglemart.shared.common.Money;
import com.minglemart.shared.domain.BaseModel;
import com.minglemart.shared.enums.DeliverySpeed;
import com.minglemart.shared.enums.OrderStatus;

/**
 * A placed order: what was agreed, what was held, what was taken.
 *
 * <p>The three money fields are the whole payment design and they are all
 * different. {@code totalAmount} is the basket as estimated at checkout;
 * {@code authorizedAmount} is what was actually held on the card — that
 * estimate plus headroom for weighed goods that come in over; {@code
 * finalAmount} is what was captured once a picker had weighed everything and
 * found what they could.
 *
 * <p>The capture is NOT bounded by the estimate. A pound of mince that turns
 * out to weigh 1.14 lb legitimately costs more than the basket said. It IS
 * bounded by the hold, because no card network allows capturing above an
 * authorisation — which is the entire reason the headroom exists.
 */
@Entity
@Table(name = "orders")
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class OrderModel extends BaseModel {

    /** Human-facing, and what a customer reads out on the phone: MM-2026-4KD9P2XA. */
    @Column(name = "order_number", nullable = false, unique = true, updatable = false, length = 32)
    private String orderNumber;

    @Column(name = "user_id", nullable = false, updatable = false)
    private UUID userId;

    /** Nullable: the cart may be swept long after the order outlives it. */
    @Column(name = "cart_id")
    private UUID cartId;

    /** Which billing account this will be charged against, pinned at placement. */
    @Column(name = "billing_account_id")
    private UUID billingAccountId;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 24)
    private OrderStatus status = OrderStatus.PENDING;

    @Builder.Default
    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "currency", nullable = false, length = 3)
    private String currency = "USD";

    // ---- what was agreed at checkout --------------------------------------

    @Column(name = "subtotal_amount", nullable = false, precision = 19, scale = 4)
    private BigDecimal subtotalAmount;

    @Builder.Default
    @Column(name = "discount_amount", nullable = false, precision = 19, scale = 4)
    private BigDecimal discountAmount = BigDecimal.ZERO;

    /** Fixed at placement and never recalculated, however the pick goes. */
    @Builder.Default
    @Column(name = "shipping_amount", nullable = false, precision = 19, scale = 4)
    private BigDecimal shippingAmount = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "tax_amount", nullable = false, precision = 19, scale = 4)
    private BigDecimal taxAmount = BigDecimal.ZERO;

    @Column(name = "total_amount", nullable = false, precision = 19, scale = 4)
    private BigDecimal totalAmount;

    // ---- what actually happened to the money ------------------------------

    /**
     * The figure the card is held for: the estimate plus headroom for weighed
     * lines that come in over. Computed at placement, so the payment module
     * authorises a number rather than recalculating one, and never below
     * {@link #totalAmount}.
     */
    @Column(name = "authorized_amount", precision = 19, scale = 4)
    private BigDecimal authorizedAmount;

    /** Null until the pick is confirmed. Never above {@link #authorizedAmount}. */
    @Column(name = "final_amount", precision = 19, scale = 4)
    private BigDecimal finalAmount;

    @Builder.Default
    @Column(name = "refunded_amount", nullable = false, precision = 19, scale = 4)
    private BigDecimal refundedAmount = BigDecimal.ZERO;

    // ---- provenance -------------------------------------------------------

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "actor_type", nullable = false, length = 16)
    private ActorType actorType = ActorType.USER;

    /** Stops a retried "place the order" tool call producing two orders. */
    @Column(name = "idempotency_key", unique = true, length = 128)
    private String idempotencyKey;

    // ---- delivery terms ---------------------------------------------------

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "delivery_speed", nullable = false, length = 16)
    private DeliverySpeed deliverySpeed = DeliverySpeed.STANDARD;

    /** Exactly two hours wide when present, and absent entirely on express. */
    @Column(name = "delivery_window_start")
    private Instant deliveryWindowStart;

    @Column(name = "delivery_window_end")
    private Instant deliveryWindowEnd;

    /**
      * Where it is going. Held by id: the customer owns their addresses, and an
      * order names the one it used rather than keeping a private copy that can
      * drift out of step with it.
      */
    @Column(name = "delivery_address_id")
    private UUID deliveryAddressId;

    @Column(name = "customer_note")
    private String customerNote;

    @Column(name = "placed_at")
    private Instant placedAt;

    @Column(name = "cancelled_at")
    private Instant cancelledAt;

    @OneToMany(mappedBy = "order", fetch = FetchType.LAZY,
               cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<OrderItemModel> items = new ArrayList<>();

    // ---- behaviour --------------------------------------------------------

    public void addItem(OrderItemModel item) {
        items.add(item);
        item.setOrder(this);
    }

    /** What the shopper was quoted. */
    public Money total() {
        return new Money(totalAmount, currency);
    }

    /** What is held on the card, if anything is yet. */
    public Optional<Money> hold() {
        return Optional.ofNullable(authorizedAmount).map(amount -> new Money(amount, currency));
    }

    /** What was, or will be, taken. */
    public Optional<Money> charged() {
        return Optional.ofNullable(finalAmount).map(amount -> new Money(amount, currency));
    }

    /**
     * How much of the hold would go unused. Worth watching: a large one means
     * the headroom is being calculated too generously, and a shopper is staring
     * at a pending charge well above what they spent.
     */
    public Optional<BigDecimal> unusedHold() {
        return authorizedAmount == null || finalAmount == null
                ? Optional.empty()
                : Optional.of(authorizedAmount.subtract(finalAmount));
    }
}
