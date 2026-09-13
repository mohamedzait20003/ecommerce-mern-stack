package com.minglemart.modules.order.dtos;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import com.minglemart.modules.order.models.OrderItemModel;
import com.minglemart.modules.order.models.OrderModel;
import com.minglemart.modules.order.models.OrderStatusHistoryModel;
import com.minglemart.shared.enums.DeliverySpeed;
import com.minglemart.shared.enums.OrderStatus;
import com.minglemart.shared.enums.PriceUnit;

/**
 * An order as the customer sees it.
 *
 * <p>Three amounts, and the page should show all three honestly: what was
 * estimated, what is held on the card, and — once the pick is done — what was
 * actually charged. A hold that is larger than the estimate is not a mistake,
 * and saying so up front is most of what stops the support ticket.
 */
public record OrderResponse(
        UUID id,
        String orderNumber,
        OrderStatus status,
        String currency,
        BigDecimal estimate,
        BigDecimal held,
        BigDecimal charged,
        BigDecimal shipping,
        DeliverySpeed deliverySpeed,
        Instant deliveryWindowStart,
        Instant deliveryWindowEnd,
        UUID deliveryAddressId,
        String customerNote,
        Instant placedAt,
        List<Line> lines,
        List<Step> trail) {

    /**
     * {@code estimated} is true for anything weighed — the line total is what
     * the shopper was quoted, and the scale has the last word.
     */
    public record Line(
            UUID id,
            String sku,
            String productName,
            String variantName,
            BigDecimal quantity,
            PriceUnit quantityUnit,
            BigDecimal unitPrice,
            BigDecimal lineTotal,
            boolean estimated) {

        static Line from(OrderItemModel item) {
            return new Line(
                    item.getId(),
                    item.getSku(),
                    item.getProductName(),
                    item.getVariantName(),
                    item.getQuantity(),
                    item.getPriceUnit(),
                    item.getUnitPriceAmount(),
                    item.getTotalAmount(),
                    item.weighed());
        }
    }

    /** One move the order made. The live stream sends these as they happen. */
    public record Step(OrderStatus from, OrderStatus to, String reason, Instant at) {

        static Step from(OrderStatusHistoryModel row) {
            return new Step(row.getFromStatus(), row.getToStatus(), row.getReason(), row.getCreatedAt());
        }
    }

    public static OrderResponse from(OrderModel order, List<OrderStatusHistoryModel> trail) {
        return new OrderResponse(
                order.getId(),
                order.getOrderNumber(),
                order.getStatus(),
                order.getCurrency(),
                order.getTotalAmount(),
                order.getAuthorizedAmount(),
                order.getFinalAmount(),
                order.getShippingAmount(),
                order.getDeliverySpeed(),
                order.getDeliveryWindowStart(),
                order.getDeliveryWindowEnd(),
                order.getDeliveryAddressId(),
                order.getCustomerNote(),
                order.getPlacedAt(),
                order.getItems().stream().map(Line::from).toList(),
                trail.stream().map(Step::from).toList());
    }
}
