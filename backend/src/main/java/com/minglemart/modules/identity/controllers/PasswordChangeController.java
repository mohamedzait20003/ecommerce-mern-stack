package com.minglemart.modules.identity.controllers;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.minglemart.modules.identity.dtos.PasswordChangeRequest;
import com.minglemart.modules.identity.services.AuthService;
import com.minglemart.shared.common.ApiResponse;
import com.minglemart.shared.domain.Authorize;
import com.minglemart.shared.domain.AuthUser;
import com.minglemart.shared.contracts.AccessTokenVerifier;
import com.minglemart.shared.domain.BaseController;

@RestController
@RequestMapping("/api/profile/password")
public class PasswordChangeController extends BaseController {
    private final AuthService auth;

    public PasswordChangeController(AuthService auth) {
        this.auth = auth;
    }

    @Authorize(session = true)
    @PostMapping
    public ResponseEntity<ApiResponse<Void>> change(@AuthUser AccessTokenVerifier.Principal caller, @Valid @RequestBody PasswordChangeRequest request) {

        if (!request.passwordsMatch()) {
            return failure(HttpStatus.BAD_REQUEST, "Passwords do not match.", "PASSWORD_MISMATCH");
        }

        if (request.isUnchanged()) {
            return failure(HttpStatus.BAD_REQUEST,"Your new password must be different from the current one.", "PASSWORD_UNCHANGED");
        }

        auth.changePassword(
            caller.userId(),
            caller.sessionId(),
            request.currentPassword(),
            request.password()
        );

        return ok("Password changed. Other devices have been signed out.");
}
}
