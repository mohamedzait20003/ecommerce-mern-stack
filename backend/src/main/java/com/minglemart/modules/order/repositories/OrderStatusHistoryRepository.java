package com.minglemart.modules.order.repositories;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.minglemart.modules.order.models.OrderStatusHistoryModel;

/**
 * Append-only, and also the feed the customer's live tracking renders from.
 */
public interface OrderStatusHistoryRepository extends JpaRepository<OrderStatusHistoryModel, UUID> {

    List<OrderStatusHistoryModel> findByOrderIdOrderByCreatedAt(UUID orderId);
}
