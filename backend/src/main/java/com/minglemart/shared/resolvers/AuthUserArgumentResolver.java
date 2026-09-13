package com.minglemart.shared.resolvers;

import java.util.UUID;

import org.springframework.core.MethodParameter;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

import com.minglemart.shared.domain.AuthUser;
import com.minglemart.shared.contracts.AccessTokenVerifier;

public class AuthUserArgumentResolver implements HandlerMethodArgumentResolver {
    @Override
    public boolean supportsParameter(MethodParameter parameter) {
        return parameter.hasParameterAnnotation(AuthUser.class);
    }

    @Override
    public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer, NativeWebRequest webRequest, WebDataBinderFactory binderFactory) {
        Class<?> type = parameter.getParameterType();
        boolean wantsPrincipal = AccessTokenVerifier.Principal.class.equals(type);

        if (!wantsPrincipal && !UUID.class.equals(type)) {
            throw new IllegalStateException("@AuthUser supports UUID or AccessTokenVerifier.Principal, not %s (on %s)".formatted(type.getSimpleName(), parameter.getMethod()));
        }

        AccessTokenVerifier.Principal caller = currentCaller();

        if (caller == null) {
            AuthUser annotation = parameter.getParameterAnnotation(AuthUser.class);

            if (annotation != null && !annotation.required()) {
                return null;
            }

            throw new AuthenticationCredentialsNotFoundException("No authenticated caller.");
        }

        return wantsPrincipal ? caller : caller.userId();
    }

    private AccessTokenVerifier.Principal currentCaller() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }

        return authentication.getPrincipal() instanceof AccessTokenVerifier.Principal caller ? caller : null;
    }
}
