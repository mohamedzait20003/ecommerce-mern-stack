package com.minglemart.shared.contracts;

import java.util.Optional;
import java.util.UUID;

public interface UserDirectory {

    Optional<UserSummary> findById(UUID userId);

    boolean isActive(UUID userId);

    /**
     * The address orders go to unless the shopper picks another. Empty when
     * they have never saved one — which checkout treats as a reason to stop,
     * not a reason to guess.
     */
    Optional<UUID> defaultAddressId(UUID userId);

    /**
     * Whether this address belongs to this customer and has not been removed.
     * An order names an address by id, and the id arrives from a browser, so
     * ownership is checked rather than assumed from possession.
     */
    boolean ownsAddress(UUID userId, UUID addressId);

    record UserSummary(
            UUID id,
            String email,
            String displayName,
            boolean verified,
            boolean agentEnabled) {
    }
}
