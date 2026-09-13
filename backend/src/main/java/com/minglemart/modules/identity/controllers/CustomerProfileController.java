package com.minglemart.modules.identity.controllers;

import java.util.UUID;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.minglemart.modules.identity.dtos.CustomerProfileRequest;
import com.minglemart.modules.identity.dtos.CustomerProfileResponse;
import com.minglemart.modules.identity.models.UserModel;
import com.minglemart.modules.identity.services.CustomerProfileService;
import com.minglemart.modules.identity.services.UserService;
import com.minglemart.shared.common.ApiResponse;
import com.minglemart.shared.domain.AuthUser;
import com.minglemart.shared.domain.BaseController;

/**
 * The signed-in user's own preferences.
 *
 * <p>Scoped to the caller: the user id comes from the verified access token,
 * never from the request. An id in the path or body would let anyone read or
 * rewrite someone else's settings.
 */
@RestController
@RequestMapping("/api/profile")
public class CustomerProfileController extends BaseController {

    private final CustomerProfileService profiles;
    private final UserService users;

    public CustomerProfileController(CustomerProfileService profiles, UserService users) {
        this.profiles = profiles;
        this.users = users;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<CustomerProfileResponse>> mine(
            @AuthUser UUID userId) {

        UserModel user = users.getOrThrow(userId);

        return ok("Profile loaded.", CustomerProfileResponse.from(profiles.forUser(user)));
    }

    /** PATCH, not PUT: a null field means "leave it alone". */
    @PatchMapping
    public ResponseEntity<ApiResponse<CustomerProfileResponse>> update(
            @AuthUser UUID userId,
            @Valid @RequestBody CustomerProfileRequest request) {

        UserModel user = users.getOrThrow(userId);

        var updated = profiles.updateFor(user, profile -> {
            if (request.isActivityTracked() != null)  profile.setActivityTracked(request.isActivityTracked());
            if (request.isDataShared() != null)       profile.setDataShared(request.isDataShared());
            if (request.isEmailNotified() != null)    profile.setEmailNotified(request.isEmailNotified());
            if (request.isSecurityNotified() != null) profile.setSecurityNotified(request.isSecurityNotified());
            if (request.isUpdateNotified() != null)   profile.setUpdateNotified(request.isUpdateNotified());
            if (request.agentEnabled() != null)       profile.setAgentEnabled(request.agentEnabled());
        });

        return ok("Preferences updated.", CustomerProfileResponse.from(updated));
    }

}
