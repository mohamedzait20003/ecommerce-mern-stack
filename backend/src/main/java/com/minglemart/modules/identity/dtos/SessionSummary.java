package com.minglemart.modules.identity.dtos;

import java.time.Instant;
import java.util.UUID;

import com.minglemart.modules.identity.models.SessionModel;

/**
 * One row of the active-sessions list.
 *
 * <p>The session token is deliberately absent. It is the credential itself, and
 * a screen that lists your devices has no reason to hand any of them back.
 *
 * @param current whether this is the session making the request, so the UI can
 *                label it and avoid offering to revoke the device in use
 */
public record SessionSummary(
        UUID id,
        String deviceType,
        String userAgent,
        String ipAddress,
        String location,
        Instant lastUsedAt,
        Instant expiresAt,
        Instant createdAt,
        boolean current) {

    public static SessionSummary from(SessionModel session, UUID currentSessionId) {
        return new SessionSummary(
                session.getId(),
                session.getDeviceType(),
                session.getUserAgent(),
                session.getIpAddress(),
                session.getLocation(),
                session.getLastUsedAt(),
                session.getExpiresAt(),
                session.getCreatedAt(),
                session.getId().equals(currentSessionId));
    }
}
