package com.minglemart.shared.handlers;

import java.io.IOException;
import org.springframework.http.MediaType;
import org.springframework.http.HttpStatus;
import tools.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.access.AccessDeniedHandler;

import com.minglemart.shared.common.ApiResponse;

@Component
public class SecurityHandler implements AuthenticationEntryPoint, AccessDeniedHandler {
    private final ObjectMapper json;

    public SecurityHandler(ObjectMapper json) {
        this.json = json;
    }

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response, AuthenticationException e) throws IOException {
        write(response, HttpStatus.UNAUTHORIZED, "You need to be signed in to do that.", "UNAUTHENTICATED");
    }

    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response, AccessDeniedException e) throws IOException {
        write(response, HttpStatus.FORBIDDEN, "Your account does not have access to that.", "FORBIDDEN");
    }

    private void write(HttpServletResponse response, HttpStatus status, String message, String code) throws IOException {
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write(json.writeValueAsString(ApiResponse.failed(message, code)));
    }
}
