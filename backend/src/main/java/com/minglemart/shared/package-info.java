/**
 * The kernel: what every module may see, and nothing else.
 *
 * <p>Closed, not open. Six sub-packages are exposed as named interfaces —
 * the vocabulary modules share — and the rest is the platform's own wiring:
 * security, the request-log filter, servlet resolvers. Nothing outside this
 * package imports those, and {@code ModularityTests} now fails the build if
 * anything tries.
 */
@org.springframework.modulith.ApplicationModule(
    id = "shared",
    displayName = "Shared"
)
package com.minglemart.shared;
