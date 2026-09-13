package com.minglemart.modules.order.repositories;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.minglemart.modules.order.models.OrderModel;
import com.minglemart.shared.domain.BaseRepository;
import com.minglemart.shared.enums.OrderStatus;

public interface OrderRepository extends BaseRepository<OrderModel> {

    Optional<OrderModel> findByOrderNumber(String orderNumber);

    boolean existsByOrderNumber(String orderNumber);

    /** How a retried "place the order" call finds the order it already made. */
    Optional<OrderModel> findByIdempotencyKey(String idempotencyKey);

    Page<OrderModel> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    @Query("""
           select o from OrderModel o
           left join fetch o.items
           where o.id = :id
           """)
    Optional<OrderModel> findWithItems(@Param("id") UUID id);

    /** The moderator's board: everything waiting on somebody. */
    List<OrderModel> findByStatusInOrderByCreatedAt(Collection<OrderStatus> statuses);

    /**
     * Orders sitting on a hold that nobody has moved. A card authorisation
     * lasts about a week and this flow is same-day, so anything here for a day
     * has gone wrong — and if the hold lapses, the capture fails on goods that
     * are already bagged.
     */
    @Query("""
           select o from OrderModel o
           where o.status in :statuses and o.createdAt < :cutoff
           order by o.createdAt
           """)
    List<OrderModel> findStale(@Param("statuses") Collection<OrderStatus> statuses,
                               @Param("cutoff") Instant cutoff);

    /**
     * How many orders are already booked into a delivery window. Nothing caps
     * this yet — the count exists so a capacity rule has something to read.
     */
    @Query("""
           select count(o) from OrderModel o
           where o.deliveryWindowStart = :start
             and o.status not in :excluded
           """)
    long countInWindow(@Param("start") Instant start,
                       @Param("excluded") Collection<OrderStatus> excluded);
}
