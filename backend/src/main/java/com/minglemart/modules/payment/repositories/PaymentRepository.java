package com.minglemart.modules.payment.repositories;

import java.util.List;
import java.util.UUID;
import java.util.Optional;

import com.minglemart.shared.enums.PaymentStatus;
import com.minglemart.shared.domain.BaseRepository;
import com.minglemart.modules.payment.models.PaymentModel;

public interface PaymentRepository extends BaseRepository<PaymentModel> {
    Optional<PaymentModel> findByIdempotencyKey(String idempotencyKey);

    /** How a webhook finds the payment its intent belongs to. */
    Optional<PaymentModel> findByProviderAndProviderPaymentId(String provider, String providerPaymentId);

    List<PaymentModel> findByOrderIdOrderByCreatedAt(UUID orderId);

    /** The live hold for an order, if it still has one. */
    Optional<PaymentModel> findFirstByOrderIdAndStatusOrderByCreatedAtDesc(UUID orderId, PaymentStatus status);

    /**
     * Captures that failed with the goods already picked. Nothing retries these
     * on a timer — the hold was already agreed, so a failure here is unusual
     * enough that a person should see it.
     */
    List<PaymentModel> findByStatusOrderByFirstFailedAt(PaymentStatus status);
}
