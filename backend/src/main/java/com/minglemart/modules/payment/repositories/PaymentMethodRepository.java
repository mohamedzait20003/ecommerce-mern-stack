package com.minglemart.modules.payment.repositories;

import java.util.List;
import java.util.UUID;
import java.util.Optional;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;

import com.minglemart.modules.payment.models.PaymentMethodModel;

public interface PaymentMethodRepository extends JpaRepository<PaymentMethodModel, UUID> {
       List<PaymentMethodModel> findByUserIdAndDeletedAtIsNull(UUID userId);

       Optional<PaymentMethodModel> findByProviderAndProviderToken(String provider, String token);

       /**
       * The method an order is charged against. Partial-unique in the schema, so
       * there is at most one live default per user.
       */
       @Query("""
              select m from PaymentMethodModel m
              where m.userId = :userId and m.defaultMethod = true and m.deletedAt is null
       """)
       Optional<PaymentMethodModel> findDefaultFor(@Param("userId") UUID userId);

       /** Clears the flag before a new default is set; the index allows only one. */
       @Query("""
              update PaymentMethodModel m set m.defaultMethod = false
              where m.userId = :userId and m.defaultMethod = true
       """)
       @org.springframework.data.jpa.repository.Modifying
       void clearDefaultFor(@Param("userId") UUID userId);
}
