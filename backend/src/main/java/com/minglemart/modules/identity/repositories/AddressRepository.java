package com.minglemart.modules.identity.repositories;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.minglemart.modules.identity.models.AddressModel;
import com.minglemart.shared.domain.BaseRepository;

public interface AddressRepository extends BaseRepository<AddressModel> {

    List<AddressModel> findByUserIdAndDeletedAtIsNull(UUID userId);

    Optional<AddressModel> findByIdAndUserIdAndDeletedAtIsNull(UUID id, UUID userId);

    Optional<AddressModel> findByUserIdAndIsDefaultTrueAndDeletedAtIsNull(UUID userId);

}
