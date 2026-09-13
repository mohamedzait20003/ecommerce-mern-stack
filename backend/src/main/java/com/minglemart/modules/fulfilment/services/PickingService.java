package com.minglemart.modules.fulfilment.services;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityNotFoundException;

import com.minglemart.modules.fulfilment.models.PickedItemModel;
import com.minglemart.modules.fulfilment.models.PickingTaskModel;
import com.minglemart.modules.fulfilment.repositories.PickedItemRepository;
import com.minglemart.modules.fulfilment.repositories.PickingTaskRepository;
import com.minglemart.shared.common.ActorRef;
import com.minglemart.shared.contracts.CatalogQuery;
import com.minglemart.shared.contracts.FulfilmentOperations;
import com.minglemart.shared.contracts.OrderOperations;
import com.minglemart.shared.contracts.StockLedger;
import com.minglemart.shared.domain.BaseDataService;
import com.minglemart.shared.enums.PickOutcome;
import com.minglemart.shared.enums.PickingTaskStatus;
import com.minglemart.shared.enums.SubstituteStatus;
import com.minglemart.shared.events.PickingStarted;
import com.minglemart.shared.events.SubstituteProposed;

/**
 * Walking the store.
 *
 * <p>This is where the system finally asks whether the goods exist. Carts hold
 * nothing and the card authorisation moves nothing, so a shortfall discovered
 * here is an ordinary answer to an ordinary question — and because the capture
 * is for what was found, it never becomes a refund.
 *
 * <p>It is also the customer's only say in what they are charged: the picker
 * proposes a swap at the shelf and they answer it on the spot. Nothing later
 * asks them to approve a total.
 */
@Service
public class PickingService extends BaseDataService<PickingTaskModel, PickingTaskRepository>
        implements FulfilmentOperations {

    /** How long a picker waits in an aisle before moving on. */
    public static final Duration PROPOSAL_PATIENCE = Duration.ofMinutes(3);

    private final PickedItemRepository pickedItems;
    private final StockLedger stock;
    private final OrderOperations orders;
    private final CatalogQuery catalog;
    private final ApplicationEventPublisher events;

    public PickingService(PickingTaskRepository repository,
                          PickedItemRepository pickedItems,
                          StockLedger stock,
                          OrderOperations orders,
                          CatalogQuery catalog,
                          ApplicationEventPublisher events) {
        super(repository);
        this.pickedItems = pickedItems;
        this.stock = stock;
        this.orders = orders;
        this.catalog = catalog;
        this.events = events;
    }

    /**
     * Opens the task that puts an order on the moderator's board. Called when
     * the hold goes on; harmless to call twice, because there is one task per
     * order and the second call finds the first.
     */
    @Transactional
    public PickingTaskModel open(UUID orderId) {
        return repository.findByOrderId(orderId)
                .orElseGet(() -> repository.save(PickingTaskModel.builder().orderId(orderId).build()));
    }

    @Override
    protected String entityName() {
        return "Picking task";
    }

    // --- the board ---

    public List<PickingTaskModel> open() {
        return repository.findByStatusInOrderByCreatedAt(
                List.of(PickingTaskStatus.UNASSIGNED, PickingTaskStatus.ASSIGNED,
                        PickingTaskStatus.PICKING));
    }

    public List<PickingTaskModel> forPicker(UUID pickerId) {
        return repository.findByPickerIdAndStatusInOrderByAssignedAt(
                pickerId, List.of(PickingTaskStatus.ASSIGNED, PickingTaskStatus.PICKING));
    }

    /** What to go and find, and what counts as finding it. */
    public List<OrderOperations.OrderLine> pickList(UUID taskId) {
        return orders.linesOf(require(taskId).getOrderId());
    }

    /** What the shelf says right now, for every line on the list. */
    public Map<UUID, BigDecimal> stockFor(List<OrderOperations.OrderLine> lines) {
        return stock.availableQuantities(lines.stream()
                .map(OrderOperations.OrderLine::variantId)
                .filter(java.util.Objects::nonNull)
                .toList());
    }

    // --- assignment ---

    /** A moderator hands the order to a picker. */
    @Transactional
    public PickingTaskModel assign(UUID orderId, UUID pickerId, UUID moderatorId) {
        PickingTaskModel task = repository.findByOrderId(orderId)
                .orElseGet(() -> PickingTaskModel.builder().orderId(orderId).build());

        task.setPickerId(pickerId);
        task.setAssignedBy(moderatorId);
        task.setStatus(PickingTaskStatus.ASSIGNED);
        task.setAssignedAt(Instant.now());

        PickingTaskModel saved = repository.save(task);

        // The order module hears this and moves the order to PROCESSING. It is
        // told rather than asked, so this module never writes an order status.
        events.publishEvent(new PickingStarted(orderId, pickerId, moderatorId));

        return saved;
    }

    // --- undoing a pick nobody is coming for ---

    @Override
    @Transactional
    public int unwindPick(UUID orderId, ActorRef actor) {
        PickingTaskModel task = repository.findByOrderId(orderId).orElse(null);
        if (task == null) {
            return 0;
        }

        // Ambient goods go back on the shelf and stay there. Chilled and frozen
        // goods go back on the shelf and are immediately written off again, so
        // the shelf nets to where it started and the ledger says what actually
        // happened — picked, returned, thrown away — rather than recording
        // waste as a sale.
        Map<UUID, OrderOperations.OrderLine> lines = new HashMap<>();
        orders.linesOf(orderId).forEach(line -> lines.put(line.orderItemId(), line));

        int returned = 0;
        for (PickedItemModel item : pickedItems.findByPickingTaskId(task.getId())) {
            if (!item.tookStock()) {
                continue;
            }

            OrderOperations.OrderLine line = lines.get(item.getOrderItemId());
            UUID variantId = item.getOutcome() == PickOutcome.SUBSTITUTED
                    ? item.getSubstituteVariantId()
                    : (line == null ? null : line.variantId());
            if (variantId == null) {
                continue;
            }

            BigDecimal taken = item.getWeightPicked() != null ? item.getWeightPicked() : item.getQuantityPicked();
            if (taken.signum() <= 0) {
                continue;
            }

            stock.apply(StockLedger.StockChange.returnedToShelf(
                    variantId, taken, orderId, actor, "Order cancelled after picking"));

            boolean restockable = catalog.findVariant(variantId)
                    .map(v -> v.storageType().restockable())
                    .orElse(true);
            if (!restockable) {
                stock.apply(StockLedger.StockChange.writtenOff(
                        variantId, taken, orderId, actor, "Out of temperature control"));
            }
            returned++;
        }

        task.setStatus(PickingTaskStatus.CANCELLED);
        task.setCompletedAt(Instant.now());
        repository.save(task);

        return returned;
    }

    @Transactional
    public PickingTaskModel start(UUID taskId, UUID pickerId) {
        PickingTaskModel task = require(taskId);
        requireHolder(task, pickerId);

        task.setStatus(PickingTaskStatus.PICKING);
        task.setStartedAt(Instant.now());
        return repository.save(task);
    }

    // --- verdicts ---

    /** Found it, all of it. */
    @Transactional
    public PickedItemModel recordFound(UUID taskId, UUID orderItemId,
                                       BigDecimal quantity, BigDecimal weight, boolean short_) {
        PickedItemModel item = verdictFor(taskId, orderItemId);
        item.setOutcome(short_ ? PickOutcome.SHORT : PickOutcome.FULL);
        item.setQuantityPicked(quantity);
        item.setWeightPicked(weight);
        return pickedItems.save(item);
    }

    /** Not there, and no swap offered. */
    @Transactional
    public PickedItemModel recordUnavailable(UUID taskId, UUID orderItemId, String note) {
        PickedItemModel item = verdictFor(taskId, orderItemId);
        item.setOutcome(PickOutcome.UNAVAILABLE);
        item.setQuantityPicked(BigDecimal.ZERO);
        item.setWeightPicked(null);
        item.setNote(note);
        return pickedItems.save(item);
    }

    /**
     * Offers a replacement and waits. The line stays UNAVAILABLE until the
     * customer says yes, so a proposal nobody answers cannot quietly put
     * something they did not choose into the bag.
     */
    @Transactional
    public PickedItemModel proposeSubstitute(UUID taskId, UUID orderItemId,
                                             UUID variantId, BigDecimal unitPrice) {
        PickedItemModel item = verdictFor(taskId, orderItemId);
        item.setOutcome(PickOutcome.UNAVAILABLE);
        item.setQuantityPicked(BigDecimal.ZERO);
        item.setSubstituteVariantId(variantId);
        item.setSubstituteUnitPriceAmount(unitPrice);
        item.setSubstituteStatus(SubstituteStatus.PROPOSED);
        item.setSubstituteProposedAt(Instant.now());
        item.setSubstituteDecidedAt(null);
        PickedItemModel saved = pickedItems.save(item);

        // The most time-sensitive message this system sends: a picker is
        // standing at a shelf waiting for the answer. Announce it with both
        // names on it, so whatever carries it to the customer has something
        // to show them without a second lookup.
        UUID orderId = saved.getPickingTask().getOrderId();
        orders.findById(orderId).ifPresent(order -> events.publishEvent(new SubstituteProposed(
                orderId,
                saved.getId(),
                order.userId(),
                lineName(orderId, orderItemId),
                catalog.findVariant(variantId).map(v -> v.productName() + ", " + v.name()).orElse("a substitute"),
                unitPrice,
                order.total().currency())));

        return saved;
    }

    /** What a customer is being asked about right now, for one order. */
    public List<PickedItemModel> pendingProposalsFor(UUID orderId) {
        return repository.findByOrderId(orderId)
                .map(task -> pickedItems.findByPickingTaskId(task.getId()).stream()
                        .filter(PickedItemModel::awaitingAnswer)
                        .toList())
                .orElse(List.of());
    }

    /**
     * The customer answers a proposal on an order that is theirs. The picked
     * quantity on a yes is what was ordered — the picker has the substitute in
     * hand and adjusts the weight when they confirm.
     */
    @Transactional
    public PickedItemModel answerAsCustomer(UUID orderId, UUID pickedItemId, boolean accepted) {
        PickedItemModel item = pickedItems.findById(pickedItemId)
                .orElseThrow(() -> new EntityNotFoundException("No such line."));

        if (!item.getPickingTask().getOrderId().equals(orderId)) {
            throw new IllegalArgumentException("That line is not on this order.");
        }

        BigDecimal ordered = orders.linesOf(orderId).stream()
                .filter(line -> line.orderItemId().equals(item.getOrderItemId()))
                .map(OrderOperations.OrderLine::quantity)
                .findFirst()
                .orElse(BigDecimal.ONE);

        return answerSubstitute(pickedItemId, accepted, ordered, null);
    }

    private String lineName(UUID orderId, UUID orderItemId) {
        return orders.linesOf(orderId).stream()
                .filter(line -> line.orderItemId().equals(orderItemId))
                .map(line -> line.productName() + ", " + line.variantName())
                .findFirst()
                .orElse("an item");
    }

    /** The customer answers, while the picker is still standing there. */
    @Transactional
    public PickedItemModel answerSubstitute(UUID pickedItemId, boolean accepted,
                                            BigDecimal quantity, BigDecimal weight) {
        PickedItemModel item = pickedItems.findById(pickedItemId)
                .orElseThrow(() -> new EntityNotFoundException("No such line."));

        if (item.getSubstituteStatus() != SubstituteStatus.PROPOSED) {
            throw new IllegalStateException("That swap has already been settled.");
        }

        item.setSubstituteDecidedAt(Instant.now());

        if (accepted) {
            item.setSubstituteStatus(SubstituteStatus.APPROVED);
            item.setOutcome(PickOutcome.SUBSTITUTED);
            item.setQuantityPicked(quantity);
            item.setWeightPicked(weight);
        } else {
            item.setSubstituteStatus(SubstituteStatus.REJECTED);
            item.setOutcome(PickOutcome.UNAVAILABLE);
            item.setQuantityPicked(BigDecimal.ZERO);
        }

        return pickedItems.save(item);
    }

    /**
     * Gives up on proposals nobody answered. A picker cannot wait in an aisle
     * indefinitely, and the line is simply unavailable — which is the same
     * outcome as a refusal, recorded differently so the two can be told apart
     * later.
     */
    @Override
    @Transactional
    public int timeOutStaleProposals() {
        Instant cutoff = Instant.now().minus(PROPOSAL_PATIENCE);
        int timedOut = 0;

        for (PickedItemModel item : pickedItems.findAwaitingAnswer()) {
            if (item.getSubstituteProposedAt().isAfter(cutoff)) {
                break; // ordered oldest first
            }
            item.setSubstituteStatus(SubstituteStatus.TIMED_OUT);
            item.setSubstituteDecidedAt(Instant.now());
            item.setOutcome(PickOutcome.UNAVAILABLE);
            item.setQuantityPicked(BigDecimal.ZERO);
            pickedItems.save(item);
            timedOut++;
        }

        return timedOut;
    }

    // --- confirmation ---

    /**
     * A moderator signs the pick off. Three things happen, in this order and
     * inside one transaction: stock leaves the shelf, the order works out what
     * to charge, and the task closes.
     *
     * <p>Stock moves here and nowhere else, which is what makes the movement
     * ledger a complete account of the shelf rather than a partial one.
     */
    @Transactional
    public PickingTaskModel confirm(UUID taskId, ActorRef moderator) {
        PickingTaskModel task = repository.findWithItems(taskId)
                .orElseThrow(() -> new EntityNotFoundException("No such picking task."));

        if (task.waitingOnCustomer()) {
            throw new IllegalStateException(
                    "A swap is still waiting on the customer. Time it out or answer it first.");
        }

        List<OrderOperations.OrderLine> lines = orders.linesOf(task.getOrderId());
        Map<UUID, OrderOperations.OrderLine> byId = new HashMap<>();
        lines.forEach(line -> byId.put(line.orderItemId(), line));

        if (task.getPickedItems().size() < lines.size()) {
            throw new IllegalStateException("Every line needs a verdict before this can be confirmed.");
        }

        List<OrderOperations.PickedLine> reported = task.getPickedItems().stream()
                .map(item -> {
                    OrderOperations.OrderLine line = byId.get(item.getOrderItemId());
                    if (item.tookStock()) {
                        moveStock(item, line, task.getId(), moderator);
                    }
                    return new OrderOperations.PickedLine(
                            item.getOrderItemId(),
                            item.getOutcome(),
                            item.getQuantityPicked(),
                            item.getWeightPicked(),
                            item.getOutcome() == PickOutcome.SUBSTITUTED
                                    ? item.getSubstituteUnitPriceAmount()
                                    : null);
                })
                .toList();

        orders.settlePick(new OrderOperations.SettlePick(task.getOrderId(), reported, moderator));

        task.setStatus(PickingTaskStatus.PICKED);
        task.setCompletedAt(Instant.now());
        return repository.save(task);
    }

    // --- internals ---

    /**
     * A swap takes the SUBSTITUTE off the shelf, not the thing that was ordered.
     * Getting this backwards would leave the store short of one product and
     * long of another, with a ledger that says otherwise.
     */
    private void moveStock(PickedItemModel item, OrderOperations.OrderLine line, UUID taskId, ActorRef actor) {
        UUID variantId = item.getOutcome() == PickOutcome.SUBSTITUTED
                ? item.getSubstituteVariantId()
                : (line == null ? null : line.variantId());

        if (variantId == null) {
            log.warn("No variant to move stock against for order item {}", item.getOrderItemId());
            return;
        }

        BigDecimal taken = item.getWeightPicked() != null
                ? item.getWeightPicked()
                : item.getQuantityPicked();

        if (taken.signum() > 0) {
            stock.apply(StockLedger.StockChange.picked(variantId, taken, taskId, actor));
        }
    }

    private PickedItemModel verdictFor(UUID taskId, UUID orderItemId) {
        PickingTaskModel task = require(taskId);

        return pickedItems.findByPickingTaskIdAndOrderItemId(taskId, orderItemId)
                .orElseGet(() -> {
                    PickedItemModel fresh = PickedItemModel.builder()
                            .orderItemId(orderItemId)
                            .quantityPicked(BigDecimal.ZERO)
                            .build();
                    fresh.setPickingTask(task);
                    return fresh;
                });
    }

    private PickingTaskModel require(UUID taskId) {
        return repository.findById(taskId)
                .orElseThrow(() -> new EntityNotFoundException("No such picking task."));
    }

    private static void requireHolder(PickingTaskModel task, UUID pickerId) {
        if (task.getPickerId() == null || !task.getPickerId().equals(pickerId)) {
            throw new IllegalStateException("That task is assigned to somebody else.");
        }
    }
}
