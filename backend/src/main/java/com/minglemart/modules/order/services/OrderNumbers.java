package com.minglemart.modules.order.services;

import java.time.Year;
import java.time.ZoneOffset;
import java.security.SecureRandom;
import java.util.function.Predicate;

import org.springframework.stereotype.Component;

@Component
public class OrderNumbers {
    private static final String ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
    private static final int SUFFIX_LENGTH = 8;
    private static final int MAX_ATTEMPTS = 5;

    private final SecureRandom random = new SecureRandom();

    public String next(Predicate<String> taken) {
        for (int attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
            String candidate = generate();
            
            if (!taken.test(candidate)) {
                return candidate;
            }
        }

        throw new IllegalStateException("Could not find an unused order number in " + MAX_ATTEMPTS + " attempts.");
    }

    private String generate() {
        StringBuilder suffix = new StringBuilder(SUFFIX_LENGTH);
        for (int i = 0; i < SUFFIX_LENGTH; i++) {
            suffix.append(ALPHABET.charAt(random.nextInt(ALPHABET.length())));
        }

         return "MM-%d-%s".formatted(Year.now(ZoneOffset.UTC).getValue(), suffix);
    }
}
