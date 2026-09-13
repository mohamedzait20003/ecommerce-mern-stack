package com.minglemart.unit.shared.interceptors;

import java.lang.reflect.Method;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.method.HandlerMethod;

import com.minglemart.shared.domain.Authorize;
import com.minglemart.shared.interceptors.AuthorizeInterceptor;
import com.minglemart.shared.contracts.AccessTokenVerifier;
import com.minglemart.shared.contracts.SessionRegistry;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * The revocation window is the whole reason {@code @Authorize} exists, so these
 * pin the behaviour the stateless filter deliberately does not provide.
 */
class AuthorizeInterceptorTest {

    private static final UUID USER = UUID.randomUUID();
    private static final UUID SESSION = UUID.randomUUID();

    private final MockHttpServletRequest request = new MockHttpServletRequest();
    private final MockHttpServletResponse response = new MockHttpServletResponse();

    @AfterEach
    void clearContext() {
        SecurityContextHolder.clearContext();
    }

    // --- fixtures ---

    @SuppressWarnings("unused")
    static class Handlers {

        public void unannotated() {
        }

        @Authorize(session = true)
        public void needsLiveSession() {
        }

        @Authorize(roles = "ADMIN")
        public void needsAdmin() {
        }

        @Authorize(verified = true)
        public void needsVerified() {
        }
    }

    @Authorize(session = true)
    @SuppressWarnings("unused")
    static class AnnotatedClass {
        public void inherited() {
        }
    }

    private HandlerMethod handler(Class<?> type, String name) throws ReflectiveOperationException {
        Method method = type.getMethod(name);
        return new HandlerMethod(type.getDeclaredConstructor().newInstance(), method);
    }

    private AuthorizeInterceptor interceptorReturning(SessionRegistry.LiveSession live) {
        return new AuthorizeInterceptor(sessionId -> Optional.ofNullable(live));
    }

    private void signIn(String role) {
        var principal = new AccessTokenVerifier.Principal(USER, SESSION, role, true);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, java.util.List.of()));
    }

    private static SessionRegistry.LiveSession live(boolean active, boolean verified) {
        return new SessionRegistry.LiveSession(SESSION, USER, active, verified);
    }

    // --- tests ---

    @Test
    @DisplayName("a handler without the annotation is never touched")
    void unannotatedPassesThrough() throws Exception {
        AuthorizeInterceptor interceptor = interceptorReturning(null);

        assertThat(interceptor.preHandle(request, response, handler(Handlers.class, "unannotated"))).isTrue();
    }

    @Test
    @DisplayName("a live session is allowed through")
    void liveSessionAllowed() throws Exception {
        signIn("USER");
        AuthorizeInterceptor interceptor = interceptorReturning(live(true, true));

        assertThatCode(() -> interceptor.preHandle(request, response, handler(Handlers.class, "needsLiveSession")))
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("a revoked session is rejected even though its token still verifies")
    void revokedSessionRejected() throws Exception {
        signIn("USER");
        // Empty is what the registry returns for revoked, expired or unknown.
        AuthorizeInterceptor interceptor = interceptorReturning(null);

        assertThatThrownBy(() -> interceptor.preHandle(request, response, handler(Handlers.class, "needsLiveSession")))
                .isInstanceOf(AuthenticationCredentialsNotFoundException.class)
                .hasMessageContaining("session has ended");
    }

    @Test
    @DisplayName("a deactivated account is rejected whatever its token says")
    void deactivatedAccountRejected() throws Exception {
        signIn("USER");
        AuthorizeInterceptor interceptor = interceptorReturning(live(false, true));

        assertThatThrownBy(() -> interceptor.preHandle(request, response, handler(Handlers.class, "needsLiveSession")))
                .isInstanceOf(AuthenticationCredentialsNotFoundException.class)
                .hasMessageContaining("no longer active");
    }

    @Test
    @DisplayName("verified reads the database, not the token claim")
    void verifiedIsReadFresh() throws Exception {
        // The claim says verified; the row says otherwise, and the row wins.
        signIn("USER");
        AuthorizeInterceptor interceptor = interceptorReturning(live(true, false));

        assertThatThrownBy(() -> interceptor.preHandle(request, response, handler(Handlers.class, "needsVerified")))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("verify your email");
    }

    @Test
    @DisplayName("a missing role is 403, not 401")
    void wrongRoleDenied() throws Exception {
        signIn("USER");
        AuthorizeInterceptor interceptor = interceptorReturning(live(true, true));

        assertThatThrownBy(() -> interceptor.preHandle(request, response, handler(Handlers.class, "needsAdmin")))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    @DisplayName("role check passes case-insensitively")
    void roleMatchIsCaseInsensitive() throws Exception {
        signIn("admin");
        AuthorizeInterceptor interceptor = interceptorReturning(live(true, true));

        assertThatCode(() -> interceptor.preHandle(request, response, handler(Handlers.class, "needsAdmin")))
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("an anonymous caller is 401")
    void anonymousRejected() throws Exception {
        AuthorizeInterceptor interceptor = interceptorReturning(live(true, true));

        assertThatThrownBy(() -> interceptor.preHandle(request, response, handler(Handlers.class, "needsLiveSession")))
                .isInstanceOf(AuthenticationCredentialsNotFoundException.class);
    }

    @Test
    @DisplayName("a class-level annotation covers its methods")
    void classLevelApplies() throws Exception {
        signIn("USER");
        AuthorizeInterceptor interceptor = interceptorReturning(null);

        assertThatThrownBy(() -> interceptor.preHandle(request, response, handler(AnnotatedClass.class, "inherited")))
                .isInstanceOf(AuthenticationCredentialsNotFoundException.class);
    }
}
