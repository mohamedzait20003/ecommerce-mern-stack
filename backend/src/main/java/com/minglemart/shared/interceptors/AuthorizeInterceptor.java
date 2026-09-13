package com.minglemart.shared.interceptors;

import java.util.Arrays;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.method.HandlerMethod;
import org.springframework.security.core.Authentication;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.core.annotation.AnnotatedElementUtils;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;

import com.minglemart.shared.domain.Authorize;
import com.minglemart.shared.contracts.AccessTokenVerifier;
import com.minglemart.shared.contracts.SessionRegistry;

public class AuthorizeInterceptor implements HandlerInterceptor {
    private final SessionRegistry sessions;

    public AuthorizeInterceptor(SessionRegistry sessions) {
        this.sessions = sessions;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if (!(handler instanceof HandlerMethod method)) {
            return true;
        }

        Authorize rule = authorizeOn(method);
        if (rule == null) {
            return true;
        }

        AccessTokenVerifier.Principal caller = currentCaller();
        if (caller == null) {
            throw new AuthenticationCredentialsNotFoundException("No authenticated caller.");
        }

        requireRole(rule, caller);

        if (rule.session() || rule.verified()) {
            requireLiveSession(rule, caller);
        }

        return true;
    }

    private Authorize authorizeOn(HandlerMethod method) {
        Authorize onMethod = AnnotatedElementUtils.findMergedAnnotation(method.getMethod(), Authorize.class);

        return onMethod != null ? onMethod : AnnotatedElementUtils.findMergedAnnotation(method.getBeanType(), Authorize.class);
    }

    private void requireRole(Authorize rule, AccessTokenVerifier.Principal caller) {
        if (rule.roles().length == 0) {
            return;
        }

        String held = caller.role();
        boolean allowed = held != null && Arrays.stream(rule.roles()).anyMatch(held::equalsIgnoreCase);

        if (!allowed) {
            throw new AccessDeniedException("Requires one of: " + String.join(", ", rule.roles()));
        }
    }

    private void requireLiveSession(Authorize rule, AccessTokenVerifier.Principal caller) {
        if (caller.sessionId() == null) {
            throw new AuthenticationCredentialsNotFoundException("Token carries no session.");
        }

        SessionRegistry.LiveSession live = sessions.live(caller.sessionId()).orElseThrow(() -> new AuthenticationCredentialsNotFoundException("That session has ended. Please sign in again."));

        // A deactivated account is not a live caller, whatever its token says.
        if (!live.userActive()) {
            throw new AuthenticationCredentialsNotFoundException("This account is no longer active.");
        }

        // 403, not 401: the caller IS authenticated, they just have not finished
        // a step. Answering 401 would send the client to sign in again, which
        // does nothing about an unverified address.
        if (rule.verified() && !live.userVerified()) {
            throw new AccessDeniedException("Please verify your email address first.");
        }
    }

    private AccessTokenVerifier.Principal currentCaller() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }

        return authentication.getPrincipal() instanceof AccessTokenVerifier.Principal caller ? caller : null;
    }
}
