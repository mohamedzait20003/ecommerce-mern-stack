package com.minglemart.scheduler.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;

@Configuration
@EnableScheduling
@ConditionalOnProperty(name = "minglemart.scheduler.enabled", havingValue = "true")
public class SchedulingConfig {
}
