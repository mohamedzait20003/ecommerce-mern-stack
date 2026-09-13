package com.minglemart.modules.order.controllers;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;

import com.minglemart.modules.order.dtos.CancelRequest;
import com.minglemart.modules.order.dtos.OrderResponse;
import com.minglemart.modules.order.models.OrderModel;
import com.minglemart.modules.order.services.OrderService;
import com.minglemart.shared.common.ActorRef;
import com.minglemart.shared.common.ApiResponse;
import com.minglemart.shared.domain.AuthUser;
import com.minglemart.shared.domain.BaseController;

/**
 * A customer's own orders. Every path is scoped by the signed-in user, so an
 * order number from somebody else's receipt reads as "no such order".
 */
@RestController
@RequestMapping("/api/orders")
public class OrderController extends BaseController {

    private final OrderService orders;

    public OrderController(OrderService orders) {
        this.orders = orders;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<OrderResponse>>> mine(@AuthUser UUID userId,
                                                                 @RequestParam(defaultValue = "0") int page,
                                                                 @RequestParam(defaultValue = "20") int size) {
        Page<OrderResponse> orders = this.orders.ownedOrders(userId, pageable(page, size, "createdAt,desc"))
                .map(order -> OrderResponse.from(order, java.util.List.of()));

        return okPage("Orders loaded.", orders);
    }

    @GetMapping("/{orderNumber}")
    public ResponseEntity<ApiResponse<OrderResponse>> one(@AuthUser UUID userId,
                                                          @PathVariable String orderNumber) {
        OrderModel order = owned(orderNumber, userId);
        return ok("Order loaded.", OrderResponse.from(order, orders.trail(order.getId())));
    }

    /**
     * Cheap while the order is only a hold, and not the customer's call once a
     * picker is walking the aisles for it — the service says which.
     */
    @PostMapping("/{orderNumber}/cancel")
    public ResponseEntity<ApiResponse<OrderResponse>> cancel(@AuthUser UUID userId,
                                                             @PathVariable String orderNumber,
                                                             @Valid @RequestBody(required = false) CancelRequest request) {
        OrderModel order = owned(orderNumber, userId);

        String reason = request == null || request.reason() == null || request.reason().isBlank()
                ? "Cancelled by the customer."
                : request.reason();
        orders.cancel(order.getId(), reason, ActorRef.user(userId));

        OrderModel after = owned(orderNumber, userId);
        return ok("Order cancelled.", OrderResponse.from(after, orders.trail(after.getId())));
    }

    private OrderModel owned(String orderNumber, UUID userId) {
        return orders.ownedOrderWithItems(orderNumber, userId)
                .orElseThrow(() -> new EntityNotFoundException("No such order."));
    }
}
