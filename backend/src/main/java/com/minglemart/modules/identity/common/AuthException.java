package com.minglemart.modules.identity.common;

import org.springframework.http.HttpStatus;

/** An auth rejection the caller can act on, carrying the status to return. */
public class AuthException extends RuntimeException {

    private final HttpStatus status;
    private final String code;

    public AuthException(HttpStatus status, String code, String message) {
        super(message);
        this.status = status;
        this.code = code;
    }

    public HttpStatus status() {
        return status;
    }

    public String code() {
        return code;
    }

    public static AuthException invalidCredentials() {
        return new AuthException(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS", "Email or password is incorrect.");
    }

    /**
     * Signalled on sign-in by an unverified account. The caller resends the
     * verification email rather than letting the user in.
     */
    public static AuthException emailNotVerified() {
        return new AuthException(HttpStatus.FORBIDDEN, "EMAIL_NOT_VERIFIED", "Your email is not verified. We have sent you a new verification link.");
    }

    public static AuthException emailTaken() {
        return new AuthException(HttpStatus.CONFLICT, "EMAIL_TAKEN", "An account with that email already exists.");
    }

    public static AuthException usernameTaken() {
        return new AuthException(HttpStatus.CONFLICT, "USERNAME_TAKEN", "That username is already taken.");
    }

    public static AuthException invalidToken() {
        return new AuthException(HttpStatus.BAD_REQUEST, "INVALID_TOKEN", "This link is invalid or has already been used.");
    }

    public static AuthException invalidGoogleToken() {
        return new AuthException(HttpStatus.UNAUTHORIZED, "INVALID_GOOGLE_TOKEN", "That Google sign-in could not be verified. Please try again.");
    }

    /** Google can assert an address it has not confirmed; that is not proof of ownership. */
    public static AuthException googleEmailUnverified() {
        return new AuthException(HttpStatus.FORBIDDEN, "GOOGLE_EMAIL_UNVERIFIED", "Your Google account email is not verified.");
    }

    public static AuthException invalidRefresh() {
        return new AuthException(HttpStatus.UNAUTHORIZED, "INVALID_REFRESH", "Your session could not be renewed. Please sign in again.");
    }

    public static AuthException passwordNotSet() {
        return new AuthException(HttpStatus.CONFLICT, "PASSWORD_NOT_SET", "This account signs in with Google. Set a password before changing one.");
    }

    public static AuthException invalidSession() {
        return new AuthException(HttpStatus.UNAUTHORIZED, "INVALID_SESSION", "Your session could not be verified. Please sign in again.");
    }
}
