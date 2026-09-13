package com.minglemart.shared.contracts;

import java.util.UUID;
import java.util.Optional;

public interface SessionRegistry {
    Optional<LiveSession> live(UUID sessionId);

    record LiveSession(
        UUID sessionId,
        UUID userId,
        boolean userActive,
        boolean userVerified
    ) {}
}
