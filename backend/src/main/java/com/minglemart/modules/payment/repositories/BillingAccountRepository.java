package com.minglemart.modules.payment.repositories;

import java.util.UUID;
import java.util.Optional;

import com.minglemart.shared.domain.BaseRepository;
import com.minglemart.modules.payment.models.BillingAccountModel;

public interface BillingAccountRepository extends BaseRepository<BillingAccountModel> {
    /** One account per user per provider, which the schema enforces. */
    Optional<BillingAccountModel> findByUserIdAndProvider(UUID userId, String provider);

    /** How a webhook finds the local account it is about. */
    Optional<BillingAccountModel> findByProviderAndProviderCustomerId(String provider, String customerId);
}
