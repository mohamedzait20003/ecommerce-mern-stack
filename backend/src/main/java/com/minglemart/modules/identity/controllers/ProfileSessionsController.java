package com.minglemart.modules.identity.controllers;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.minglemart.modules.identity.dtos.SessionSummary;
import com.minglemart.modules.identity.models.SessionModel;
import com.minglemart.modules.identity.services.SessionService;
import com.minglemart.shared.common.ApiResponse;
import com.minglemart.shared.domain.Authorize;
import com.minglemart.shared.domain.AuthUser;
import com.minglemart.shared.contracts.AccessTokenVerifier;
import com.minglemart.shared.domain.BaseController;

/**
 * The devices signed in to this account.
 *
 * <p>Revocation is scoped by owner, not by session id alone: the id is looked up
 * among the CALLER's sessions, so a valid id belonging to someone else is a 404
 * rather than a way to sign a stranger out.
 */
@RestController
@RequestMapping("/api/profile/sessions")
@Authorize(session = true)
public class ProfileSessionsController extends BaseController {

    private final SessionService sessions;

    public ProfileSessionsController(SessionService sessions) {
        this.sessions = sessions;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<SessionSummary>>> mine(
            @AuthUser AccessTokenVerifier.Principal caller) {

        List<SessionSummary> active = sessions.activeFor(caller.userId()).stream()
                .map(session -> SessionSummary.from(session, caller.sessionId()))
                .toList();

        return ok("Sessions loaded.", active);
    }

    /** Sign out one device. Revoking the current one is allowed - it is a sign-out. */
    @DeleteMapping("/{sessionId}")
    public ResponseEntity<ApiResponse<Void>> revoke(
            @AuthUser AccessTokenVerifier.Principal caller,
            @PathVariable UUID sessionId) {

        boolean owned = sessions.activeFor(caller.userId()).stream()
                .map(SessionModel::getId)
                .anyMatch(sessionId::equals);

        if (!owned) {
            return failure(HttpStatus.NOT_FOUND, "That session is not active.", "NOT_FOUND");
        }

        sessions.revoke(sessionId);

        return ok("Session revoked.");
    }

    /** Sign out everywhere else, keeping the device making the request. */
    @DeleteMapping
    public ResponseEntity<ApiResponse<Integer>> revokeOthers(
            @AuthUser AccessTokenVerifier.Principal caller) {

        int revoked = sessions.revokeOthers(caller.userId(), caller.sessionId());

        return ok("Signed out of %d other device(s).".formatted(revoked), revoked);
    }

}
