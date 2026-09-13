package com.minglemart.shared.contracts;

import java.util.UUID;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import com.minglemart.shared.common.Money;
import com.minglemart.shared.enums.PickOutcome;
import com.minglemart.shared.enums.PriceBy;
import com.minglemart.shared.enums.PriceUnit;
import com.minglemart.shared.enums.SellBy;
import com.minglemart.shared.common.ActorRef;
import com.minglemart.shared.enums.OrderStatus;
import com.minglemart.shared.enums.DeliverySpeed;

public interface OrderOperations {

    OrderSummary place(PlaceOrder command);

    Optional<OrderSummary> findByNumber(String orderNumber);

    Optional<OrderSummary> findById(UUID orderId);

    /**
     * The order, but only if it is this customer's. For any endpoint outside
     * the order module that takes an order number from a URL.
     */
    Optional<OrderSummary> findOwned(String orderNumber, UUID userId);

    /**
     * Orders sitting on a card hold that nobody has moved. A card
     * authorisation lasts about a week and this flow is same-day, so anything
     * here has gone wrong — and if the hold lapses, the capture fails against
     * goods that are already bagged.
     */
    List<OrderSummary> findStaleHolds(Instant olderThan);

    void cancel(UUID orderId, String reason, ActorRef actor);

    /**
     * What the picker found, reported back so the order can work out what to
     * charge.
     *
     * <p>The split matters: fulfilment knows what came off the shelf, this
     * module knows what it costs. Sending units rather than money keeps prices
     * in the one place that snapshotted them, and keeps the two rules that
     * bound a capture — a substitute never costs more than the line it
     * replaced, and nothing is billed past the weight band the shopper was
     * quoted — from having to be reimplemented anywhere else.
     */
    OrderSummary settlePick(SettlePick command);

    /**
     * The pick list: what a picker is walking the store to find, in the terms
     * the order was placed in rather than whatever the catalogue says today.
     *
     * <p>The weight band travels with it because the picker needs to know what
     * counts as filled — "3.5 to 4.5 lb" is the instruction, not a detail.
     */
    List<OrderLine> linesOf(UUID orderId);

    record PlaceOrder(
        UUID userId,
        UUID billingAccountId,
        DeliverySpeed deliverySpeed,
        Instant deliveryWindowStart,
        /** One of the customer's own addresses; their default unless they chose another. */
        UUID deliveryAddressId,
        String customerNote,
        String idempotencyKey,
        ActorRef actor
    ) {}

    record OrderLine(
        UUID orderItemId,
        UUID variantId,
        String sku,
        String productName,
        String variantName,
        java.math.BigDecimal quantity,
        SellBy sellBy,
        PriceBy priceBy,
        PriceUnit priceUnit,
        java.math.BigDecimal minWeight,
        java.math.BigDecimal maxWeight
    ) {
        public boolean weighed() {
            return priceBy == PriceBy.WEIGHT;
        }
    }

    record SettlePick(UUID orderId, List<PickedLine> lines, ActorRef actor) {}

    /**
     * {@code weightPicked} is what the scale said, null on anything not
     * weighed. {@code substituteUnitPrice} is what the replacement costs per
     * unit, null unless a swap actually went in the bag.
     */
    record PickedLine(
        UUID orderItemId,
        PickOutcome outcome,
        java.math.BigDecimal quantityPicked,
        java.math.BigDecimal weightPicked,
        java.math.BigDecimal substituteUnitPrice
    ) {}

    record OrderSummary(
        UUID id,
        String orderNumber,
        UUID userId,
        OrderStatus status,
        Money total,
        Optional<Money> hold
    ) {}
}
