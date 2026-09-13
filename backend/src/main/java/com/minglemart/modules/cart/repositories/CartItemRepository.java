package com.minglemart.modules.cart.repositories;

import java.util.UUID;
import java.util.List;
import java.util.Optional;

import com.minglemart.shared.domain.BaseRepository;
import com.minglemart.modules.cart.models.CartItemModel;

public interface CartItemRepository extends BaseRepository<CartItemModel> {
    Optional<CartItemModel> findByCartIdAndVariantId(UUID cartId, UUID variantId);

    List<CartItemModel> findByCartId(UUID cartId);

    void deleteByCartIdAndVariantId(UUID cartId, UUID variantId);

    void deleteByCartId(UUID cartId);
}
