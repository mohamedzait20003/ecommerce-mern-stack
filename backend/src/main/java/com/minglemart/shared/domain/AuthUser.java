package com.minglemart.shared.domain;

import java.lang.annotation.*;

@Target(ElementType.PARAMETER)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface AuthUser {
    boolean required() default true;
}
