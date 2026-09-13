package com.minglemart.modules.identity.services;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minglemart.modules.identity.models.AddressModel;
import com.minglemart.modules.identity.models.UserModel;
import com.minglemart.modules.identity.repositories.AddressRepository;
import com.minglemart.shared.domain.BaseDataService;

@Service
public class AddressService extends BaseDataService<AddressModel, AddressRepository> {

    public AddressService(AddressRepository repository) {
        super(repository);
    }

    @Override
    protected String entityName() {
        return "Address";
    }

    public List<AddressModel> forUser(UUID userId) {
        return repository.findByUserIdAndDeletedAtIsNull(userId);
    }

    /** Scoped by user, so one account cannot read another account address by id. */
    public Optional<AddressModel> forUser(UUID userId, UUID addressId) {
        return repository.findByIdAndUserIdAndDeletedAtIsNull(addressId, userId);
    }

    /** Where this customer's orders go unless they pick another. */
    public Optional<AddressModel> defaultFor(UUID userId) {
        return repository.findByUserIdAndIsDefaultTrueAndDeletedAtIsNull(userId);
    }

    /**
     * Clears the previous default before setting the new one — a partial unique
     * index allows exactly one, so the two writes cannot be reordered.
     */
    @Transactional
    public AddressModel makeDefault(UUID userId, UUID addressId) {
        repository.findByUserIdAndIsDefaultTrueAndDeletedAtIsNull(userId)
                .ifPresent(current -> current.setDefault(false));
        repository.flush();

        return update(addressId, address -> address.setDefault(true));
    }

    /**
     * Adds an address to an account.
     *
     * <p>The owner is bound here rather than taken from the request, so a
     * client cannot file an address against someone else's account. The first
     * address a user saves becomes the default - a single address that is the
     * default for nothing is never what was meant.
     */
    @Transactional
    public AddressModel createFor(UserModel user, AddressModel address) {
        boolean first = repository.findByUserIdAndDeletedAtIsNull(user.getId()).isEmpty();

        address.setUser(user);
        if (first) {
            address.setDefault(true);
        }

        AddressModel saved = create(address);

        if (!first && address.isDefault()) {
            makeDefault(user.getId(), saved.getId());
        }

        return saved;
    }

    @Transactional
    public AddressModel softDelete(UUID addressId) {
        return update(addressId, AddressModel::markDeleted);
    }
}