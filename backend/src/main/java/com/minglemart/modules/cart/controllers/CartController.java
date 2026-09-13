package com.minglemart.modules.cart.controllers;

import java.util.UUID;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.minglemart.shared.common.ActorRef;
import com.minglemart.shared.common.ApiResponse;
import com.minglemart.shared.domain.AuthUser;
import com.minglemart.shared.domain.BaseController;
import com.minglemart.modules.cart.dtos.CartResponse;
import com.minglemart.modules.cart.services.CartService;
import com.minglemart.modules.cart.dtos.CartItemRequest;
import com.minglemart.modules.cart.dtos.CartQuantityRequest;

@RestController
@RequestMapping("/api/cart")
public class CartController extends BaseController {

    private final CartService carts;

    public CartController(CartService carts) {
        this.carts = carts;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<CartResponse>> mine(@AuthUser UUID userId) {
        return ok("Cart loaded.", carts.viewFor(userId));
    }

    @PostMapping("/items")
    public ResponseEntity<ApiResponse<CartResponse>> add(@AuthUser UUID userId, @Valid @RequestBody CartItemRequest request) {
        carts.addItem(userId, request.variantId(), request.quantity(), actor(userId));

        return ok("Added to cart.", carts.viewFor(userId));
    }

    /** PATCH sets an absolute quantity; zero removes the line. */
    @PatchMapping("/items/{variantId}")
    public ResponseEntity<ApiResponse<CartResponse>> updateQuantity(@AuthUser UUID userId, @PathVariable UUID variantId, @Valid @RequestBody CartQuantityRequest request) {
        carts.updateQuantity(userId, variantId, request.quantity(), actor(userId));

        return ok("Cart updated.", carts.viewFor(userId));
    }

    @DeleteMapping("/items/{variantId}")
    public ResponseEntity<ApiResponse<CartResponse>> remove(@AuthUser UUID userId, @PathVariable UUID variantId) {
        carts.removeItem(userId, variantId, actor(userId));

        return ok("Removed from cart.", carts.viewFor(userId));
    }

    @DeleteMapping
    public ResponseEntity<ApiResponse<CartResponse>> clear(@AuthUser UUID userId) {
        carts.clear(userId);

        return ok("Cart cleared.", carts.viewFor(userId));
    }

    private ActorRef actor(UUID userId) {
        return ActorRef.user(userId);
    }
}
