package com.minglemart.modules.payment.repositories;

import java.util.List;
import java.util.UUID;
import java.time.Instant;
import java.util.Optional;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;

import com.minglemart.modules.payment.models.PaymentEventModel;

public interface PaymentEventRepository extends JpaRepository<PaymentEventModel, UUID> {

    boolean existsByProviderAndProviderEventId(String provider, String providerEventId);

    Optional<PaymentEventModel> findByProviderAndProviderEventId(String provider, String providerEventId);

    @Query("""
        select e from PaymentEventModel e
        where e.processedAt is null and e.createdAt < :cutoff
        order by e.createdAt
    """)
    List<PaymentEventModel> findUnprocessedBefore(@Param("cutoff") Instant cutoff);
}
