package com.minglemart.modules.cart.repositories;

import java.util.List;
import java.util.UUID;
import java.time.Instant;
import java.util.Optional;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.minglemart.shared.enums.CartStatus;
import com.minglemart.shared.domain.BaseRepository;
import com.minglemart.modules.cart.models.CartModel;


public interface CartRepository extends BaseRepository<CartModel> {
    Optional<CartModel> findByUserIdAndStatus(UUID userId, CartStatus status);


    @Query("SELECT c FROM CartModel c LEFT JOIN FETCH c.items WHERE c.userId = :userId AND c.status = :status")
    Optional<CartModel> findWithItems(@Param("userId") UUID userId, @Param("status") CartStatus status);

    /** Candidates for the abandonment sweep. */
    List<CartModel> findByStatusAndExpiresAtBefore(CartStatus status, Instant cutoff);
}
