package com.minglemart.modules.fulfilment.controllers;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;

import com.minglemart.modules.fulfilment.dtos.SubstituteAnswerRequest;
import com.minglemart.modules.fulfilment.dtos.SubstituteProposalResponse;
import com.minglemart.modules.fulfilment.models.PickedItemModel;
import com.minglemart.modules.fulfilment.services.PickingService;
import com.minglemart.shared.common.ApiResponse;
import com.minglemart.shared.contracts.CatalogQuery;
import com.minglemart.shared.contracts.OrderOperations;
import com.minglemart.shared.domain.AuthUser;
import com.minglemart.shared.domain.BaseController;

/**
 * The customer's only say in what they are charged, and it happens while a
 * picker is standing in an aisle.
 *
 * <p>Addressed by order number under {@code /api/orders} because that is how
 * the customer thinks of it, even though the rows belong to fulfilment.
 * Ownership is checked through the order contract on every call; the number
 * arrives from a browser.
 */
@RestController
@RequestMapping("/api/orders/{orderNumber}/substitutes")
public class CustomerSubstituteController extends BaseController {

    private final PickingService picking;
    private final OrderOperations orders;
    private final CatalogQuery catalog;

    public CustomerSubstituteController(PickingService picking, OrderOperations orders, CatalogQuery catalog) {
        this.picking = picking;
        this.orders = orders;
        this.catalog = catalog;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<SubstituteProposalResponse>>> pending(@AuthUser UUID userId,
                                                                                @PathVariable String orderNumber) {
        OrderOperations.OrderSummary order = owned(orderNumber, userId);

        Map<UUID, OrderOperations.OrderLine> lines = orders.linesOf(order.id()).stream()
                .collect(Collectors.toMap(OrderOperations.OrderLine::orderItemId, Function.identity()));

        List<SubstituteProposalResponse> proposals = picking.pendingProposalsFor(order.id()).stream()
                .map(item -> SubstituteProposalResponse.from(
                        item,
                        nameOf(lines.get(item.getOrderItemId())),
                        catalog.findVariant(item.getSubstituteVariantId())
                                .map(v -> v.productName() + ", " + v.name())
                                .orElse("a substitute")))
                .toList();

        return ok("Proposals loaded.", proposals);
    }

    @PostMapping("/{pickedItemId}")
    public ResponseEntity<ApiResponse<Void>> answer(@AuthUser UUID userId,
                                                    @PathVariable String orderNumber,
                                                    @PathVariable UUID pickedItemId,
                                                    @Valid @RequestBody SubstituteAnswerRequest request) {
        OrderOperations.OrderSummary order = owned(orderNumber, userId);
        PickedItemModel answered = picking.answerAsCustomer(order.id(), pickedItemId, request.accepted());

        return ok(answered.getOutcome().tookStock() ? "Swap accepted." : "Swap declined.");
    }

    private OrderOperations.OrderSummary owned(String orderNumber, UUID userId) {
        return orders.findOwned(orderNumber, userId)
                .orElseThrow(() -> new EntityNotFoundException("No such order."));
    }

    private static String nameOf(OrderOperations.OrderLine line) {
        return line == null ? "an item" : line.productName() + ", " + line.variantName();
    }
}
