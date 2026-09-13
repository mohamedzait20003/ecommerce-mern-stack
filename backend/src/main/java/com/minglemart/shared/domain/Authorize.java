package com.minglemart.shared.domain;

import java.lang.annotation.*;

@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface Authorize {
    String[] roles() default {};

    boolean session() default false;

    boolean verified() default false;
}
