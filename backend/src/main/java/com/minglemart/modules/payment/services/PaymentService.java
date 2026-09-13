package com.minglemart.modules.payment.services;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityNotFoundException;

import com.minglemart.modules.payment.gateway.PaymentException;
import com.minglemart.modules.payment.gateway.StripeGateway;
import com.minglemart.modules.payment.models.BillingAccountModel;
import com.minglemart.modules.payment.models.PaymentMethodModel;
import com.minglemart.modules.payment.models.PaymentModel;
import com.minglemart.modules.payment.models.RefundModel;
import com.minglemart.modules.payment.repositories.PaymentMethodRepository;
import com.minglemart.modules.payment.repositories.PaymentRepository;
import com.minglemart.modules.payment.repositories.RefundRepository;
import com.minglemart.shared.common.ActorRef;
import com.minglemart.shared.common.Money;
import com.minglemart.shared.contracts.PaymentOperations;
import com.minglemart.shared.domain.BaseDataService;
import com.minglemart.shared.enums.PaymentStatus;
import com.minglemart.shared.enums.RefundStatus;


@Service
public class PaymentService extends BaseDataService<PaymentModel, PaymentRepository> implements PaymentOperations {
    private final PaymentMethodRepository methods;
    private final RefundRepository refunds;
    private final BillingAccountService accounts;
    private final StripeGateway gateway;
    private final PaymentEventService webhooks;

    public PaymentService(
        PaymentRepository repository,
        PaymentMethodRepository methods,
        RefundRepository refunds,
        BillingAccountService accounts,
        StripeGateway gateway,
        PaymentEventService webhooks
    ) {
        super(repository);
        this.methods = methods;
        this.refunds = refunds;
        this.accounts = accounts;
        this.gateway = gateway;
        this.webhooks = webhooks;
    }

    @Override
    public int drainWebhookInbox() {
        return webhooks.drain();
    }

    @Override
    public int countStuckWebhooks(java.time.Instant olderThan) {
        return webhooks.stuck(olderThan).size();
    }

    @Override
    protected String entityName() {
        return "Payment";
    }

    @Override
    public Optional<UUID> billingAccountId(UUID userId) {
        return accounts.forUser(userId).map(BillingAccountModel::getId);
    }

    @Override
    public boolean canPay(UUID userId) {
        return accounts.forUser(userId).filter(BillingAccountModel::chargeable).isPresent() && methods.findDefaultFor(userId).filter(PaymentMethodModel::usable).isPresent();
    }

    // --- the hold ---

    /**
     * {@code noRollbackFor}: a decline is recorded, then thrown. Without it the
     * throw rolls back the FAILED row written a line earlier, and a customer
     * whose card was refused leaves no trace of the refusal.
     */
    @Override
    @Transactional(noRollbackFor = PaymentException.class)
    public PaymentResult authorize(AuthorizeOrder command) {
        Optional<PaymentModel> already = existing(command.idempotencyKey());
        if (already.isPresent()) {
            return resultOf(already.get());
        }

        BillingAccountModel account = accounts.forUser(command.userId())
            .filter(BillingAccountModel::chargeable)
            .orElseThrow(() -> new IllegalStateException("Add a payment method before placing an order."));

        PaymentMethodModel method = methods.findDefaultFor(command.userId())
            .filter(PaymentMethodModel::usable)
            .orElseThrow(() -> new IllegalStateException("Your saved card cannot be charged. Add another before placing an order."));

        // Written before the provider is called, so a crash mid-request leaves a
        // row to reconcile against rather than a hold nobody knows about.
        PaymentModel payment = repository.save(PaymentModel.builder()
            .orderId(command.orderId())
            .paymentMethodId(method.getId())
            .amount(command.amount().amount())
            .currency(command.amount().currency())
            .status(PaymentStatus.PENDING)
            .actorType(command.actor().type())
            .idempotencyKey(command.idempotencyKey())
            .build());

        try {
            StripeGateway.Authorization authorization = gateway.authorize(
                new StripeGateway.AuthorizeRequest(
                    account.getProviderCustomerId(),
                    method.getProviderToken(),
                    command.amount(),
                    command.idempotencyKey(),
                    Map.of("order_id", command.orderId().toString())
                )
            );

            payment.setProviderPaymentId(authorization.providerPaymentId());
            payment.setProviderClientSecret(authorization.clientSecret());

            // The shopper is still at the keyboard here, so a challenge is
            // something they can actually answer rather than an email chase.
            if ("requires_action".equals(authorization.status())) {
                payment.setStatus(PaymentStatus.REQUIRES_ACTION);
            } else {
                payment.markAuthorised(authorization.providerPaymentId(), Instant.now());
            }

            return resultOf(repository.save(payment));

        } catch (PaymentException declined) {
            payment.markFailed(declined.code(), declined.getMessage());
            repository.save(payment);
            throw declined;
        }
    }

    // --- taking it ---

    @Override
    @Transactional(noRollbackFor = PaymentException.class)
    public PaymentResult capture(CaptureOrder command) {
        // At-least-once delivery means this can be asked twice for one order.
        // The second time the answer is the first time's answer, not a second
        // charge.
        Optional<PaymentModel> alreadyTaken = repository
                .findFirstByOrderIdAndStatusOrderByCreatedAtDesc(command.orderId(), PaymentStatus.CAPTURED);
        if (alreadyTaken.isPresent()) {
            return resultOf(alreadyTaken.get());
        }

        PaymentModel payment = repository.findFirstByOrderIdAndStatusOrderByCreatedAtDesc(command.orderId(), PaymentStatus.AUTHORIZED).orElseThrow(() -> new IllegalStateException("There is no hold on this order to capture."));

        // Belt and braces against the one rule the card networks will not bend.
        // The order module already sizes the hold to cover this; if the two ever
        // disagree, failing here beats a declined capture on a bagged order.
        if (command.amount().isMoreThan(payment.held())) {
            throw new IllegalStateException("Cannot capture %s against a hold of %s.".formatted(command.amount().amount(), payment.held().amount()));
        }

        try {
            gateway.capture(payment.getProviderPaymentId(), command.amount());

            payment.markCaptured(command.amount().amount(), Instant.now());
            payment.setProviderClientSecret(null);
            log.info("Captured {} of {} held on order {}", command.amount().amount(), payment.held().amount(), command.orderId());

            return resultOf(repository.save(payment));

        } catch (PaymentException failure) {
            // Rare, because the issuer already agreed to this money. Rare
            // enough that nothing retries it on a timer — somebody looks.
            payment.markFailed(failure.code(), failure.getMessage());
            repository.save(payment);
            throw failure;
        }
    }

    @Override
    @Transactional
    public void releaseHold(UUID orderId, String reason, ActorRef actor) {
        repository.findFirstByOrderIdAndStatusOrderByCreatedAtDesc(orderId, PaymentStatus.AUTHORIZED)
                .ifPresent(payment -> {
                    gateway.releaseHold(payment.getProviderPaymentId());
                    payment.setStatus(PaymentStatus.CANCELLED);
                    payment.setFailureMessage(reason);
                    repository.save(payment);
                });
    }

    // --- money going back ---

    @Override
    @Transactional
    public RefundResult requestRefund(RequestRefund command) {
        Optional<RefundModel> already = command.idempotencyKey() == null
                ? Optional.empty()
                : refunds.findByIdempotencyKey(command.idempotencyKey());
        if (already.isPresent()) {
            return new RefundResult(already.get().getId(), already.get().getStatus());
        }

        PaymentModel payment = repository.findById(command.paymentId())
                .orElseThrow(() -> new EntityNotFoundException("No such payment."));

        if (!payment.getStatus().settled()) {
            throw new IllegalStateException(
                    "Nothing has been taken for this order, so there is nothing to give back.");
        }

        // Stops at REQUESTED on purpose. An agent may open one; a person signs
        // it off, and the schema will not accept an APPROVED row that does not
        // name who did.
        RefundModel refund = refunds.save(RefundModel.builder()
                .paymentId(payment.getId())
                .orderId(command.orderId())
                .amount(command.amount().amount())
                .currency(command.amount().currency())
                .reason(command.reason())
                .reasonNote(command.note())
                .status(RefundStatus.REQUESTED)
                .requestedByActor(command.actor().type())
                .requestedByUserId(command.actor().userId())
                .idempotencyKey(command.idempotencyKey())
                .build());

        return new RefundResult(refund.getId(), refund.getStatus());
    }

    /** Sends an approved refund to the provider. Human-owned, by design. */
    @Transactional
    public RefundResult sendRefund(UUID refundId, UUID approvedBy) {
        RefundModel refund = refunds.findById(refundId)
                .orElseThrow(() -> new EntityNotFoundException("No such refund."));

        if (refund.getStatus() != RefundStatus.REQUESTED) {
            throw new IllegalStateException("That refund is already " + refund.getStatus() + ".");
        }

        PaymentModel payment = repository.findById(refund.getPaymentId())
                .orElseThrow(() -> new EntityNotFoundException("No such payment."));

        refund.approve(approvedBy, Instant.now());
        refund.setStatus(RefundStatus.PROCESSING);
        refunds.save(refund);

        try {
            StripeGateway.RefundReceipt receipt = gateway.refund(
                    payment.getProviderPaymentId(),
                    refund.money(),
                    refund.getIdempotencyKey());

            refund.setProviderRefundId(receipt.providerRefundId());
            refund.setStatus(RefundStatus.SUCCEEDED);
            refund.setProcessedAt(Instant.now());

            payment.setRefundedAmount(payment.getRefundedAmount().add(refund.getAmount()));
            repository.save(payment);

        } catch (PaymentException failure) {
            refund.setStatus(RefundStatus.FAILED);
            refund.setFailureMessage(failure.getMessage());
        }

        RefundModel saved = refunds.save(refund);
        return new RefundResult(saved.getId(), saved.getStatus());
    }

    // --- internals ---

    private Optional<PaymentModel> existing(String idempotencyKey) {
        return idempotencyKey == null
                ? Optional.empty()
                : repository.findByIdempotencyKey(idempotencyKey);
    }

    private static PaymentResult resultOf(PaymentModel payment) {
        return new PaymentResult(payment.getId(), payment.getStatus(), payment.getProviderClientSecret());
    }

    static Money moneyOf(PaymentModel payment) {
        return payment.held();
    }
}
