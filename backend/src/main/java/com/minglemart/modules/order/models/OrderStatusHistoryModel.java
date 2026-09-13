package com.minglemart.modules.order.models;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import org.hibernate.annotations.Generated;
import org.hibernate.generator.EventType;

import com.minglemart.shared.common.ActorType;
import com.minglemart.shared.enums.OrderStatus;

/**
 * Every move an order made, who made it, and why.
 *
 * <p>Append-only, hence no setters and no {@code updated_at}. This is also the
 * feed the customer's live order tracking is built from — the transition, the
 * actor and the timestamp are exactly what "picking started" and "out for
 * delivery" are rendered from, so nothing separate needs maintaining.
 */
@Entity
@Table(name = "order_status_history")
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderStatusHistoryModel {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "order_id", nullable = false, updatable = false)
    private UUID orderId;

    /** Null on the very first row: nothing came before PENDING. */
    @Enumerated(EnumType.STRING)
    @Column(name = "from_status", updatable = false, length = 24)
    private OrderStatus fromStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "to_status", nullable = false, updatable = false, length = 24)
    private OrderStatus toStatus;

    @Column(name = "reason", updatable = false)
    private String reason;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "actor_type", nullable = false, updatable = false, length = 16)
    private ActorType actorType = ActorType.SYSTEM;

    @Column(name = "actor_user_id", updatable = false)
    private UUID actorUserId;

    @Generated(event = EventType.INSERT)
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
