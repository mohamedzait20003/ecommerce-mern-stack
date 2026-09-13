package com.minglemart.shared.config;

import java.util.List;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import com.minglemart.shared.contracts.SessionRegistry;
import com.minglemart.shared.resolvers.AuthUserArgumentResolver;
import com.minglemart.shared.interceptors.AuthorizeInterceptor;

/**
 * Controller-argument and interceptor wiring for the whole application.
 *
 * <p>Both pieces are constructed here rather than being {@code @Component}s, for
 * the same reason {@code SecurityConfig} constructs {@code AccessTokenFilter}:
 * they live in the {@code shared} module, and a bean there gets wrapped by
 * Modulith's observability proxying. Neither has state worth proxying, and each
 * has exactly one place it should be registered.
 *
 * <p>{@link SessionRegistry} arrives through the contract, not the identity
 * service that implements it - the same indirection that keeps
 * {@code AccessTokenVerifier} from turning into a module cycle.
 */
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    private final SessionRegistry sessions;

    public WebMvcConfig(SessionRegistry sessions) {
        this.sessions = sessions;
    }

    @Override
    public void addArgumentResolvers(List<HandlerMethodArgumentResolver> resolvers) {
        resolvers.add(new AuthUserArgumentResolver());
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new AuthorizeInterceptor(sessions)).addPathPatterns("/api/**");
    }
}
