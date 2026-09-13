package com.minglemart.modules.identity.factories;

import java.net.URLEncoder;
import java.time.Duration;
import java.nio.charset.StandardCharsets;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import com.minglemart.shared.common.AuthCookies;
import com.minglemart.shared.domain.BaseFactory;
import com.minglemart.modules.identity.models.UserModel;
import com.minglemart.modules.identity.services.TokenProperties;

@Component
public class AuthCookieFactory extends BaseFactory {
    public static final String ACCESS_COOKIE = AuthCookies.ACCESS;
    public static final String REFRESH_COOKIE = AuthCookies.REFRESH;
    public static final String SESSION_COOKIE = AuthCookies.SESSION;

    private static final String REFRESH_PATH = "/api/auth";

    private final TokenProperties properties;

    public AuthCookieFactory(TokenProperties properties) {
        this.properties = properties;
    }

    /**
     * The access cookie outlives the access token it carries, deliberately.
     *
     * The token's own 15-minute expiry is enforced by its {@code exp} claim, in
     * {@code AccessTokenFilter} — the cookie's max-age enforces nothing. Giving
     * the cookie the token's lifetime meant the browser deleted it at the exact
     * moment it became needed: {@code /auth/refresh} requires BOTH cookies,
     * because the access token carries the hash the refresh token is checked
     * against and the session id to rotate. With the cookie gone, refresh saw a
     * null access token and answered INVALID_REFRESH, so no session could ever
     * be renewed — every visitor was signed out after fifteen minutes.
     *
     * {@code readAccessTokenIgnoringExpiry} exists precisely because refresh is
     * meant to read an EXPIRED access token. Carrying the refresh lifetime is
     * what lets it.
     */
    public ResponseCookie access(String jwt) {
        return base(ACCESS_COOKIE, jwt, properties.refreshTtl()).httpOnly(true).path("/").build();
    }

    public ResponseCookie refresh(String token) {
        return base(REFRESH_COOKIE, token, properties.refreshTtl()).httpOnly(true).path(REFRESH_PATH).build();
    }

    public ResponseCookie session(UserModel user, String publicUserId) {
        String json = "{\"role\":%s,\"isVerified\":%s,\"publicUserId\":%s}".formatted(
                quoted(user.getRole() != null ? user.getRole().getName() : null),
                user.isVerified(),
                quoted(publicUserId));

        return base(SESSION_COOKIE, URLEncoder.encode(json, StandardCharsets.UTF_8),
                properties.refreshTtl())
                .httpOnly(false)
                .path("/")
                .build();
    }

    private static String quoted(String value) {
        return value == null ? "null" : "\"" + value + "\"";
    }

    /** Expired duplicates of all three, for sign-out. */
    public ResponseCookie[] clearAll() {
        return new ResponseCookie[] {
            base(ACCESS_COOKIE, "", Duration.ZERO).httpOnly(true).path("/").build(),
            base(REFRESH_COOKIE, "", Duration.ZERO).httpOnly(true).path(REFRESH_PATH).build(),
            base(SESSION_COOKIE, "", Duration.ZERO).httpOnly(false).path("/").build(),
        };
    }

    private ResponseCookie.ResponseCookieBuilder base(String name, String value, Duration maxAge) {
        return ResponseCookie.from(name, value).maxAge(maxAge).secure(properties.secureCookies()).sameSite("Lax");
    }
}
