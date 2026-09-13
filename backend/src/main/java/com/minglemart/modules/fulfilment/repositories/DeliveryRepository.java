package com.minglemart.modules.fulfilment.repositories;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.minglemart.modules.fulfilment.models.DeliveryModel;
import com.minglemart.shared.domain.BaseRepository;
import com.minglemart.shared.enums.DeliveryStatus;

public interface DeliveryRepository extends BaseRepository<DeliveryModel> {

    Optional<DeliveryModel> findByOrderId(UUID orderId);

    @Query("""
           select d from DeliveryModel d
           left join fetch d.attempts
           where d.id = :id
           """)
    Optional<DeliveryModel> findWithAttempts(@Param("id") UUID id);

    List<DeliveryModel> findByStatusInOrderByPromisedWindowStart(Collection<DeliveryStatus> statuses);

    /** One driver's run. */
    List<DeliveryModel> findByDriverIdAndStatusInOrderByPromisedWindowStart(
            UUID driverId, Collection<DeliveryStatus> statuses);

    /**
     * Still out, and past what was promised. Express carries no window, so it
     * never appears here — which is exactly the gap in reporting that giving
     * express an SLA would close.
     */
    @Query("""
           select d from DeliveryModel d
           where d.promisedWindowEnd < :now
             and d.status in :open
           order by d.promisedWindowEnd
           """)
    List<DeliveryModel> findLate(@Param("now") Instant now,
                                 @Param("open") Collection<DeliveryStatus> open);
}
