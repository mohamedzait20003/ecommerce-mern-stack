package com.minglemart.modules.identity.services;

import java.util.UUID;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minglemart.shared.contracts.UserDirectory;
import com.minglemart.modules.identity.models.UserModel;
import com.minglemart.modules.identity.models.AddressModel;
import com.minglemart.modules.identity.repositories.UserRepository;

@Service
@Transactional(readOnly = true)
public class UserDirectoryService implements UserDirectory {
    private final UserRepository users;
    private final UserService userService;
    private final AddressService addresses;
    private final CustomerProfileService profiles;

    public UserDirectoryService(
        UserRepository users,
        UserService userService,
        AddressService addresses,
        CustomerProfileService profiles
    ) {
        this.users = users;
        this.userService = userService;
        this.addresses = addresses;
        this.profiles = profiles;
    }

    @Override
    public Optional<UserSummary> findById(UUID userId) {
        return users.findById(userId).map(this::summarise);
    }

    @Override
    public boolean isActive(UUID userId) {
        return userService.findActive(userId).isPresent();
    }

    @Override
    public Optional<UUID> defaultAddressId(UUID userId) {
        return addresses.defaultFor(userId).map(AddressModel::getId);
    }

    @Override
    public boolean ownsAddress(UUID userId, UUID addressId) {
        return addresses.forUser(userId, addressId).isPresent();
    }

    private UserSummary summarise(UserModel user) {
        String displayName = ((user.getFname() == null ? "" : user.getFname()) + " " + (user.getLname() == null ? "" : user.getLname())).trim();

        return new UserSummary(
            user.getId(),
            user.getEmail(),
            displayName.isEmpty() ? user.getUsername() : displayName,
            user.isVerified(),
            profiles.forUser(user).isAgentEnabled()
        );
    }
}
