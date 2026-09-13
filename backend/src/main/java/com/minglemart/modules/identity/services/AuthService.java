package com.minglemart.modules.identity.services;

import com.minglemart.modules.identity.common.AuthException;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import jakarta.servlet.http.HttpServletRequest;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minglemart.modules.identity.dtos.SignInRequest;
import com.minglemart.modules.identity.dtos.SignUpRequest;
import org.springframework.security.oauth2.jwt.Jwt;

import com.minglemart.modules.identity.common.TokenHasher;
import com.minglemart.modules.identity.factories.SessionHandleFactory;
import com.minglemart.modules.identity.models.SessionModel;
import com.minglemart.modules.identity.models.TokensModel;
import com.minglemart.modules.identity.models.UserModel;
import org.springframework.beans.factory.annotation.Value;

import com.minglemart.shared.contracts.AuthNotifications;
import com.minglemart.shared.domain.BaseIntegrationService;
import com.minglemart.shared.enums.TokenType;

/**
 * Composes the identity data services into the flows an auth endpoint needs.
 *
 * <p>An {@code IntegrationService}, not a {@code DataService}: it owns no table.
 * It coordinates {@link UserService}, {@link SessionService}, {@link TokenService}
 * and {@link JwtService}, which each own theirs.
 */
@Service
public class AuthService extends BaseIntegrationService {

    /** Result of a successful sign-in: the user plus the cookies to set. */
    public record Established(
            UserModel user,
            String accessToken,
            String refreshToken,
            /** Derived id for URLs, the session cookie and the store. */
            String publicUserId) {
    }

    private final UserService users;
    private final RoleService roles;
    private final SessionService sessions;
    private final TokenService tokens;
    private final JwtService jwt;
    private final OAuthAccountService oauthAccounts;
    private final PasswordEncoder passwords;
    private final SessionHandleFactory sessionHandles;
    private final AuthNotifications authMail;
    private final String frontendUrl;

    public AuthService(UserService users, RoleService roles, SessionService sessions,
                       TokenService tokens, JwtService jwt,
                       OAuthAccountService oauthAccounts, PasswordEncoder passwords,
                       SessionHandleFactory sessionHandles,
                       AuthNotifications authMail,
                       @Value("${minglemart.app.frontend-url:http://localhost:5173}") String frontendUrl) {
        this.users = users;
        this.roles = roles;
        this.sessions = sessions;
        this.tokens = tokens;
        this.jwt = jwt;
        this.oauthAccounts = oauthAccounts;
        this.passwords = passwords;
        this.sessionHandles = sessionHandles;
        this.authMail = authMail;
        this.frontendUrl = frontendUrl;
    }

    // ------------------------------------------------------------ sign in ---

    @Transactional
    public Established signIn(SignInRequest request, HttpServletRequest http) {
        UserModel user = users.findByEmail(request.email())
                .orElseThrow(AuthException::invalidCredentials);

        if (user.getPasswordHash() == null
                || !passwords.matches(request.password(), user.getPasswordHash())) {
            throw AuthException.invalidCredentials();
        }

        if (user.getDeletedAt() != null || !user.isActive()) {
            throw AuthException.invalidCredentials();
        }

        // Unverified accounts get a fresh link rather than a session.
        if (!user.isVerified()) {
            issueVerificationToken(user);
            throw AuthException.emailNotVerified();
        }

        return establish(user, http);
    }

    // ------------------------------------------------------------ sign up ---

    /**
     * Creates the account and issues a verification token.
     *
     * <p>Does not sign the user in: they must follow the emailed link first.
     */
    @Transactional
    public UserModel signUp(SignUpRequest request) {
        if (users.emailTaken(request.email())) {
            throw AuthException.emailTaken();
        }
        if (users.usernameTaken(request.username())) {
            throw AuthException.usernameTaken();
        }

        UserModel user = users.create(UserModel.builder()
                .username(request.username())
                .email(request.email())
                .passwordHash(passwords.encode(request.password()))
                .fname(request.fname())
                .lname(request.lname())
                .gender(request.gender())
                .dateOfBirth(request.dateOfBirth())
                .role(roles.require("CUSTOMER"))
                .verified(false)
                .build());

        issueVerificationToken(user);
        return user;
    }

    // ------------------------------------------------------- google sign ----

    /**
     * Signs in through Google, creating the account on first use.
     *
     * <p>Unlike {@link #signUp}, an existing email is not an error here - that
     * is the normal returning-user path. Google has already verified the
     * address, so the account starts verified and skips the email step.
     *
     * @param email    verified address from the Google ID token
     * @param fname    given name from the token
     * @param lname    family name from the token
     */
    @Transactional
    public Established googleSignIn(GoogleService.OAuthProfile profile, HttpServletRequest http) {
        // Resolve by provider subject first: it is immutable, where an email can
        // be reassigned to a different person.
        UserModel user = oauthAccounts.findByProviderUser(profile.provider(), profile.subject())
                .map(link -> link.getUser())
                // Falling back to email links Google to an account someone
                // already registered with a password, rather than creating a
                // duplicate they cannot sign into.
                .or(() -> users.findByEmail(profile.email()))
                .orElseGet(() -> users.create(UserModel.builder()
                        .username(uniqueUsernameFrom(profile.email()))
                        .email(profile.email())
                        .fname(orFallback(profile.givenName(), profile.email().split("@")[0]))
                        .lname(orFallback(profile.familyName(), "-"))
                        .profilePicUrl(profile.pictureUrl())
                        .role(roles.require("CUSTOMER"))
                        // Google verified the address, so no email round trip.
                        .verified(true)
                        .build()));

        if (!user.isVerified()) {
            user = users.markVerified(user.getId());
        }

        oauthAccounts.link(user, profile);

        return establish(user, http);
    }

    // ------------------------------------------------------------ refresh ---

    /**
     * Rotates the token pair.
     *
     * <p>Three checks, in order of cost:
     * <ol>
     *   <li>the access token's signature is valid (expiry ignored - it having
     *       just expired is why we are here);</li>
     *   <li>the refresh token hashes to the {@code rth} claim inside it, which
     *       proves the two cookies were issued together;</li>
     *   <li>the session row is still live.</li>
     * </ol>
     *
     * <p>Rolling: the old refresh value is replaced, so a copy taken earlier
     * stops working the moment the real client rotates.
     */
    @Transactional
    public Established refresh(String accessToken, String refreshToken, HttpServletRequest http) {
        if (accessToken == null || refreshToken == null) {
            throw AuthException.invalidRefresh();
        }

        Jwt access = jwt.readAccessTokenIgnoringExpiry(accessToken)
                .orElseThrow(AuthException::invalidRefresh);

        if (!jwt.tokensRelated(access, refreshToken)) {
            // The pair does not belong together: one of the two cookies came
            // from somewhere else.
            log.warn("refresh rejected: access/refresh mismatch for session {}",
                    access.getClaimAsString(JwtService.CLAIM_SESSION_ID));
            throw AuthException.invalidRefresh();
        }

        SessionModel session = sessions.resolve(refreshToken)
                .orElseThrow(AuthException::invalidRefresh);

        UserModel user = session.getUser();
        String rotated = jwt.issueRefreshToken();

        sessions.rotate(session.getId(), rotated, jwt.refreshExpiry());

        // The handle is deliberately unchanged: rotating it would change the
        // caller's URLs on every refresh and break every open tab.
        return new Established(user, jwt.issueAccessToken(user, session, rotated), rotated,
                sessionHandles.derive(session.getPublicUserId(), session.getPublicUserIdSalt()));
    }

    // ------------------------------------------------------ session proof ---

    /** A session confirmed by proof, with the handle recovered from it. */
    public record VerifiedSession(UserModel user, String publicUserId) {
    }

    /**
     * Confirms a session on page reload.
     *
     * <p>Both halves are required. The refresh cookie says WHICH session; the
     * proof says the caller genuinely holds it. Checking only the cookie would
     * make this a plain session lookup; checking only the proof would leave no
     * way to find the private key that opens it.
     */
    @Transactional(readOnly = true)
    public VerifiedSession verifySession(String refreshToken, String publicUserId) {
        if (refreshToken == null || publicUserId == null) {
            throw AuthException.invalidSession();
        }

        SessionModel session = sessions.resolve(refreshToken)
                .orElseThrow(AuthException::invalidSession);

        // Recomputed from the two stored halves, compared in constant time.
        if (!sessionHandles.matches(
                session.getPublicUserId(), session.getPublicUserIdSalt(), publicUserId)) {
            log.warn("public user id did not match session {}", session.getId());
            throw AuthException.invalidSession();
        }

        return new VerifiedSession(session.getUser(), publicUserId);
    }

    // ------------------------------------------------------------ sign out --

    @Transactional
    public void signOut(String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) {
            return;
        }
        sessions.resolve(refreshToken).ifPresent(session -> sessions.revoke(session.getId()));
    }

    // ------------------------------------------------------ password reset --

    /**
     * Issues a reset token.
     *
     * <p>Returns quietly for an unknown address: telling a caller which emails
     * exist turns this endpoint into an account enumeration oracle.
     */
    @Transactional
    public Optional<TokensModel> requestPasswordReset(String email) {
        return users.findByEmail(email).map(user -> {
            tokens.invalidateOutstanding(user.getId(), TokenType.PASSWORD_RESET);

            TokensModel token = tokens.create(TokensModel.builder()
                    .user(user)
                    .token(jwt.issueRefreshToken())
                    .tokenType(TokenType.PASSWORD_RESET)
                    .expiresAt(Instant.now().plusSeconds(3600))
                    .build());

            authMail.passwordReset(
                    user.getId(),
                    user.getEmail(),
                    user.getFname(),
                    link("/authenticate/password-change", token.getToken()));

            return token;
        });
    }

    @Transactional
    public UserModel resetPassword(String token, String newPassword) {
        TokensModel found = tokens.findUsable(token, TokenType.PASSWORD_RESET)
                .orElseThrow(AuthException::invalidToken);

        UUID userId = found.getUser().getId();
        users.update(userId, user -> user.setPasswordHash(passwords.encode(newPassword)));
        tokens.consume(token, TokenType.PASSWORD_RESET);

        // A password change ends every existing session.
        sessions.revokeAll(userId);

        UserModel updated = users.getOrThrow(userId);
        authMail.passwordChanged(userId, updated.getEmail(), updated.getFname());

        return users.getOrThrow(userId);
    }

    /**
     * Changes the password of a signed-in user.
     *
     * <p>Separate from {@link #resetPassword} because the proof is different: a
     * reset is authorised by an emailed single-use token, this one by knowing
     * the current password. Requiring it is what stops a borrowed session from
     * locking the owner out.
     *
     * <p>Every OTHER session is revoked, not every session. The caller has just
     * demonstrated they know the password, so signing them out of the tab they
     * are looking at would punish the wrong person - while a session an attacker
     * holds still dies here.
     *
     * @param currentSessionId the session to keep; null revokes all of them
     */
    @Transactional
    public UserModel changePassword(UUID userId, UUID currentSessionId,
                                    String currentPassword, String newPassword) {

        UserModel user = users.getOrThrow(userId);

        // An account created through Google has no password to verify against.
        if (user.getPasswordHash() == null || user.getPasswordHash().isBlank()) {
            throw AuthException.passwordNotSet();
        }

        if (!passwords.matches(currentPassword, user.getPasswordHash())) {
            throw AuthException.invalidCredentials();
        }

        users.update(userId, found -> found.setPasswordHash(passwords.encode(newPassword)));

        if (currentSessionId == null) {
            sessions.revokeAll(userId);
        } else {
            sessions.revokeOthers(userId, currentSessionId);
        }

        UserModel updated = users.getOrThrow(userId);
        authMail.passwordChanged(userId, updated.getEmail(), updated.getFname());

        return updated;
    }

    // ----------------------------------------------------- email verify -----

    @Transactional
    public UserModel verifyEmail(String token) {
        TokensModel found = tokens.findUsable(token, TokenType.EMAIL_VERIFICATION)
                .orElseThrow(AuthException::invalidToken);

        tokens.consume(token, TokenType.EMAIL_VERIFICATION);
        return users.markVerified(found.getUser().getId());
    }

    @Transactional
    public TokensModel issueVerificationToken(UserModel user) {
        tokens.invalidateOutstanding(user.getId(), TokenType.EMAIL_VERIFICATION);

        TokensModel token = tokens.create(TokensModel.builder()
                .user(user)
                .token(jwt.issueRefreshToken())
                .tokenType(TokenType.EMAIL_VERIFICATION)
                .expiresAt(Instant.now().plusSeconds(86_400))
                .build());

        // Queues in THIS transaction: no email if the signup rolls back, and no
        // SMTP latency in the response.
        authMail.emailVerification(
                user.getId(),
                user.getEmail(),
                user.getFname(),
                link("/authenticate/email-verify", token.getToken()));

        return token;
    }

    // ---------------------------------------------------------- internals ---

    /** Opens a session row and mints the token pair that references it. */
    private Established establish(UserModel user, HttpServletRequest http) {
        String refresh = jwt.issueRefreshToken();

        // Handle and salt stay on the row; only the derived id goes out.
        SessionHandleFactory.SessionHandle handle = sessionHandles.mint();

        SessionModel session = sessions.create(SessionModel.builder()
                .user(user)
                // Only the digest is stored. A leaked `sessions` table then
                // yields no usable refresh token.
                .token(TokenHasher.hash(refresh))
                .publicUserId(handle.handle())
                .publicUserIdSalt(handle.salt())
                .deviceType(http.getHeader("Sec-CH-UA-Platform"))
                .userAgent(http.getHeader("User-Agent"))
                .ipAddress(http.getRemoteAddr())
                .lastUsedAt(Instant.now())
                .expiresAt(jwt.refreshExpiry())
                .build());

        return new Established(user, jwt.issueAccessToken(user, session, refresh), refresh,
                handle.publicId());
    }

    /** Builds a frontend link carrying a token. */
    private String link(String path, String token) {
        return "%s%s?token=%s".formatted(frontendUrl, path, token);
    }

    private static String orFallback(String value, String fallback) {
        return value != null && !value.isBlank() ? value : fallback;
    }

    private String uniqueUsernameFrom(String email) {
        String stem = email.split("@")[0].replaceAll("[^a-zA-Z0-9_]", "");
        String candidate = stem;
        int suffix = 1;

        while (users.usernameTaken(candidate)) {
            candidate = stem + suffix++;
        }
        return candidate;
    }
}
