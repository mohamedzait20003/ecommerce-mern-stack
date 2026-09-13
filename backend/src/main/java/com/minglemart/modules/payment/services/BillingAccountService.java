package com.minglemart.modules.payment.services;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityNotFoundException;

import com.minglemart.modules.payment.gateway.StripeGateway;
import com.minglemart.modules.payment.models.BillingAccountModel;
import com.minglemart.modules.payment.models.PaymentMethodModel;
import com.minglemart.modules.payment.repositories.BillingAccountRepository;
import com.minglemart.modules.payment.repositories.PaymentMethodRepository;
import com.minglemart.shared.enums.BillingAccountStatus;
import com.minglemart.shared.enums.PaymentMethodType;

/**
 * Setting up how a customer pays, once, from account settings.
 *
 * <p>This runs long before any order exists, and that is deliberate: the card
 * is collected and verified while the shopper is unhurried and present, so that
 * checkout later has something to hold without asking them anything.
 */
@Service
@Transactional(readOnly = true)
public class BillingAccountService {

    private static final String PROVIDER = "STRIPE";

    private final BillingAccountRepository accounts;
    private final PaymentMethodRepository methods;
    private final StripeGateway gateway;

    public BillingAccountService(BillingAccountRepository accounts,
                                 PaymentMethodRepository methods,
                                 StripeGateway gateway) {
        this.accounts = accounts;
        this.methods = methods;
        this.gateway = gateway;
    }

    public Optional<BillingAccountModel> forUser(UUID userId) {
        return accounts.findByUserIdAndProvider(userId, PROVIDER);
    }

    public List<PaymentMethodModel> methodsFor(UUID userId) {
        return methods.findByUserIdAndDeletedAtIsNull(userId);
    }

    /**
     * Opens the account, or returns the one already there. Idempotent because
     * a shopper clicking twice should not end up with two customers at the
     * provider — the schema forbids it anyway, and this makes the failure a
     * no-op rather than an error.
     */
    @Transactional
    public BillingAccountModel open(UUID userId, String email, String displayName) {
        Optional<BillingAccountModel> existing = forUser(userId);
        if (existing.isPresent()) {
            return existing.get();
        }

        String customerId = gateway.createCustomer(email, displayName, Map.of("user_id", userId.toString()));

        return accounts.save(BillingAccountModel.builder()
                .userId(userId)
                .provider(PROVIDER)
                .providerCustomerId(customerId)
                .status(BillingAccountStatus.PENDING)
                .build());
    }

    /**
     * Starts adding a card. The returned secret goes to the browser, which
     * collects the number so it never touches this server; the finished method
     * comes back on a webhook and lands in {@link #register}.
     */
    @Transactional
    public StripeGateway.SetupSession startAddingMethod(UUID userId, String email, String displayName) {
        BillingAccountModel account = open(userId, email, displayName);
        return gateway.startMethodSetup(account.getProviderCustomerId());
    }

    /**
     * Records a method the provider has confirmed. Called from the webhook, so
     * it has to be safe to run twice: the same token arriving again updates the
     * row rather than adding a second one.
     */
    @Transactional
    public PaymentMethodModel register(String customerId,
                                       String token,
                                       String setupIntentId,
                                       String brand,
                                       String last4,
                                       Short expMonth,
                                       Short expYear) {
        BillingAccountModel account = accounts
                .findByProviderAndProviderCustomerId(PROVIDER, customerId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "No billing account for provider customer " + customerId));

        PaymentMethodModel method = methods.findByProviderAndProviderToken(PROVIDER, token)
                .orElseGet(() -> PaymentMethodModel.builder()
                        .userId(account.getUserId())
                        .billingAccount(account)
                        .provider(PROVIDER)
                        .providerToken(token)
                        .methodType(PaymentMethodType.CARD)
                        .build());

        // Merge, never overwrite with null. payment_method.attached carries
        // the card details and setup_intent.succeeded carries the off-session
        // evidence, they arrive in either order, and each must leave the
        // other's contribution alone.
        if (brand != null) method.setBrand(brand);
        if (last4 != null) method.setLast4(last4);
        if (expMonth != null) method.setExpMonth(expMonth);
        if (expYear != null) method.setExpYear(expYear);
        // The setup intent is the evidence that the cardholder agreed to be
        // charged when they are not present. The schema refuses the flag
        // without it, which is the point.
        if (setupIntentId != null) {
            method.setProviderSetupIntentId(setupIntentId);
            method.setOffSessionOk(true);
        }
        method.setDeletedAt(null);

        PaymentMethodModel saved = methods.save(method);

        // A first usable method is what turns the account on.
        if (methods.findDefaultFor(account.getUserId()).isEmpty()) {
            makeDefault(account.getUserId(), saved.getId());
        }
        if (account.getStatus() == BillingAccountStatus.PENDING) {
            account.setStatus(BillingAccountStatus.ACTIVE);
            accounts.save(account);
        }

        return saved;
    }

    @Transactional
    public void makeDefault(UUID userId, UUID methodId) {
        PaymentMethodModel method = methods.findById(methodId)
                .orElseThrow(() -> new EntityNotFoundException("No such payment method."));

        if (!method.getUserId().equals(userId)) {
            throw new IllegalArgumentException("That payment method belongs to someone else.");
        }
        if (!method.usable()) {
            throw new IllegalStateException(
                    "That card cannot be used for orders — it has not been set up for later charges.");
        }

        // Clear first: the partial unique index allows only one live default.
        methods.clearDefaultFor(userId);
        method.setDefaultMethod(true);
        methods.save(method);
    }

    /**
     * Soft-deletes a stored method.
     *
     * <p>Nothing blocks removing one an open order depends on. It cannot strand
     * a picked order the way it would have under a charge-after-picking model:
     * the money for an open order is already held at the provider, against an
     * authorisation that does not care whether the method still exists here.
     */
    @Transactional
    public void forget(UUID userId, UUID methodId) {
        PaymentMethodModel method = methods.findById(methodId)
                .orElseThrow(() -> new EntityNotFoundException("No such payment method."));

        if (!method.getUserId().equals(userId)) {
            throw new IllegalArgumentException("That payment method belongs to someone else.");
        }

        method.setDefaultMethod(false);
        method.setDeletedAt(Instant.now());
        methods.save(method);
    }
}
