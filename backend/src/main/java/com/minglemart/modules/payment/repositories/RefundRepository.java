package com.minglemart.modules.payment.repositories;

import java.util.List;
import java.util.UUID;
import java.util.Optional;
import java.util.Collection;

import com.minglemart.shared.enums.RefundStatus;
import com.minglemart.shared.domain.BaseRepository;
import com.minglemart.modules.payment.models.RefundModel;

public interface RefundRepository extends BaseRepository<RefundModel> {
    Optional<RefundModel> findByIdempotencyKey(String idempotencyKey);

    Optional<RefundModel> findByProviderRefundId(String providerRefundId);

    List<RefundModel> findByOrderIdOrderByCreatedAt(UUID orderId);

    /** The approval queue: everything waiting on a human. */
    List<RefundModel> findByStatusInOrderByCreatedAt(Collection<RefundStatus> statuses);
}
