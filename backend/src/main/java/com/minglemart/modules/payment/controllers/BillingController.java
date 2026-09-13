package com.minglemart.modules.payment.controllers;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.persistence.EntityNotFoundException;

import com.minglemart.modules.payment.dtos.PaymentMethodResponse;
import com.minglemart.modules.payment.dtos.SetupResponse;
import com.minglemart.modules.payment.services.BillingAccountService;
import com.minglemart.shared.common.ApiResponse;
import com.minglemart.shared.contracts.UserDirectory;
import com.minglemart.shared.domain.AuthUser;
import com.minglemart.shared.domain.BaseController;

/**
 * How a customer sets up paying, once, from settings.
 *
 * <p>This runs long before any order exists, and that is the point: the card
 * is collected and confirmed while the shopper is unhurried and present, so
 * checkout later has something to hold without asking them anything.
 */
@RestController
@RequestMapping("/api/billing")
public class BillingController extends BaseController {

    private final BillingAccountService billing;
    private final UserDirectory users;

    public BillingController(BillingAccountService billing, UserDirectory users) {
        this.billing = billing;
        this.users = users;
    }

    /**
     * Starts adding a card. The browser takes the secret to Stripe Elements,
     * which collects the number and confirms the intent; the method arrives
     * back here on a webhook and appears in {@link #methods} a moment later.
     */
    @PostMapping("/setup")
    public ResponseEntity<ApiResponse<SetupResponse>> setup(@AuthUser UUID userId) {
        UserDirectory.UserSummary user = users.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("No such user."));

        var session = billing.startAddingMethod(userId, user.email(), user.displayName());
        return ok("Card setup started.", new SetupResponse(session.clientSecret()));
    }

    @GetMapping("/methods")
    public ResponseEntity<ApiResponse<List<PaymentMethodResponse>>> methods(@AuthUser UUID userId) {
        return ok("Payment methods loaded.",
                billing.methodsFor(userId).stream().map(PaymentMethodResponse::from).toList());
    }

    /** The card orders will be held against. */
    @PostMapping("/methods/{methodId}/default")
    public ResponseEntity<ApiResponse<PaymentMethodResponse>> makeDefault(@AuthUser UUID userId,
                                                                          @PathVariable UUID methodId) {
        billing.makeDefault(userId, methodId);
        return ok("Default card set.", current(userId, methodId));
    }

    @DeleteMapping("/methods/{methodId}")
    public ResponseEntity<ApiResponse<Void>> remove(@AuthUser UUID userId, @PathVariable UUID methodId) {
        billing.forget(userId, methodId);
        return ok("Card removed.");
    }

    private PaymentMethodResponse current(UUID userId, UUID methodId) {
        return billing.methodsFor(userId).stream()
                .filter(m -> m.getId().equals(methodId))
                .findFirst()
                .map(PaymentMethodResponse::from)
                .orElseThrow(() -> new EntityNotFoundException("No such payment method."));
    }
}
