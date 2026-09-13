package com.minglemart.modules.identity.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Changing a password from inside a signed-in session.
 *
 * <p>Distinct from {@code PassResetRequest}, which is driven by an emailed token
 * because the user cannot sign in. Here they are already authenticated, so the
 * proof required is the CURRENT password - without it, a borrowed session could
 * lock the owner out of their own account.
 */
public record PasswordChangeRequest(

        @NotBlank(message = "Your current password is required.")
        String currentPassword,

        @NotBlank(message = "A new password is required.")
        @Size(min = 8, max = 128, message = "Password must be at least 8 characters.")
        String password,

        @NotBlank(message = "Please confirm your new password.")
        String confirmPassword) {

    public boolean passwordsMatch() {
        return password != null && password.equals(confirmPassword);
    }

    public boolean isUnchanged() {
        return password != null && password.equals(currentPassword);
    }
}
