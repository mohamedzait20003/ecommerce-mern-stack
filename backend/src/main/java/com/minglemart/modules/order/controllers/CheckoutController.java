package com.minglemart.modules.order.controllers;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;

import com.minglemart.modules.order.dtos.CheckoutRequest;
import com.minglemart.modules.order.dtos.CheckoutResponse;
import com.minglemart.modules.order.dtos.OrderResponse;
import com.minglemart.modules.order.dtos.SlotResponse;
import com.minglemart.modules.order.models.OrderModel;
import com.minglemart.modules.order.services.CheckoutService;
import com.minglemart.modules.order.services.DeliverySlots;
import com.minglemart.modules.order.services.OrderService;
import com.minglemart.shared.common.ApiResponse;
import com.minglemart.shared.domain.AuthUser;
import com.minglemart.shared.domain.BaseController;

@RestController
@RequestMapping("/api/checkout")
public class CheckoutController extends BaseController {

    private final CheckoutService checkout;
    private final OrderService orders;
    private final DeliverySlots slots;

    public CheckoutController(CheckoutService checkout, OrderService orders, DeliverySlots slots) {
        this.checkout = checkout;
        this.orders = orders;
        this.slots = slots;
    }

    /** The windows a shopper may pick from right now. */
    @GetMapping("/slots")
    public ResponseEntity<ApiResponse<List<SlotResponse>>> slots() {
        return ok("Delivery slots loaded.",
                slots.available(Instant.now()).stream().map(SlotResponse::from).toList());
    }

    /**
     * Places the order and holds the card. 201 either way; the difference is
     * whether {@code clientSecret} comes back, which means the browser still
     * has a challenge to complete before the hold is real.
     */
    @PostMapping
    public ResponseEntity<ApiResponse<CheckoutResponse>> place(@AuthUser UUID userId,
                                                               @Valid @RequestBody CheckoutRequest request) {
        CheckoutService.Outcome outcome = checkout.checkout(userId, request);

        OrderModel order = orders.ownedOrderWithItems(outcome.orderNumber(), userId)
                .orElseThrow(() -> new EntityNotFoundException("No such order."));

        CheckoutResponse body = new CheckoutResponse(
                OrderResponse.from(order, orders.trail(order.getId())),
                outcome.clientSecret());

        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.of("Order placed.", body));
    }
}
