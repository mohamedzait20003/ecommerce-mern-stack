package com.minglemart.modules.fulfilment.repositories;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.minglemart.modules.fulfilment.models.DeliveryAttemptModel;

/** Append-only. Nothing here updates or deletes. */
public interface DeliveryAttemptRepository extends JpaRepository<DeliveryAttemptModel, UUID> {

    List<DeliveryAttemptModel> findByDeliveryIdOrderByAttemptNo(UUID deliveryId);

    long countByDeliveryId(UUID deliveryId);
}
