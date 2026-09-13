package com.minglemart.shared.common;

import java.util.UUID;


public record ActorRef(ActorType type, UUID userId) {
    public static final ActorRef SYSTEM = new ActorRef(ActorType.SYSTEM, null);

    public static ActorRef user(UUID userId) {
        return new ActorRef(ActorType.USER, userId);
    }

    public static ActorRef agent(UUID userId) {
        return new ActorRef(ActorType.AGENT, userId);
    }

    public boolean isAgent() {
        return type == ActorType.AGENT;
    }
}
