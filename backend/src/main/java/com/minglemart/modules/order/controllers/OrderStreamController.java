package com.minglemart.modules.order.controllers;

import java.util.UUID;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import jakarta.persistence.EntityNotFoundException;

import com.minglemart.modules.order.models.OrderModel;
import com.minglemart.modules.order.services.OrderService;
import com.minglemart.shared.domain.AuthUser;
import com.minglemart.shared.domain.BaseController;
import com.minglemart.shared.infra.OrderStream;

/**
 * Watching one order move, live.
 *
 * <p>Returns an {@link SseEmitter} rather than a response body: the request
 * stays open and updates are pushed down it as they happen. Whichever instance
 * is holding this connection will hear about a change made by any other,
 * because the fan-out behind it goes through Redis.
 *
 * <p>Ownership is checked once, when the stream opens. After that the
 * connection is bound to one order id and can only ever carry that order.
 */
@RestController
@RequestMapping("/api/orders")
public class OrderStreamController extends BaseController {

    private final OrderService orders;
    private final OrderStream stream;

    public OrderStreamController(OrderService orders, OrderStream stream) {
        this.orders = orders;
        this.stream = stream;
    }

    @GetMapping("/{orderNumber}/stream")
    public SseEmitter watch(@AuthUser UUID userId, @PathVariable String orderNumber) {
        OrderModel order = orders.ownedOrder(orderNumber, userId)
                .orElseThrow(() -> new EntityNotFoundException("No such order."));

        return stream.open(order.getId());
    }
}
