package com.minglemart.modules.cart.models;

import lombok.*;
import java.util.Set;
import java.util.UUID;
import java.time.Instant;
import jakarta.persistence.*;
import java.util.LinkedHashSet;
import org.hibernate.type.SqlTypes;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.JdbcTypeCode;

import com.minglemart.shared.domain.BaseModel;
import com.minglemart.shared.enums.CartStatus;

@Entity
@Table(name = "carts")
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class CartModel extends BaseModel {
    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "session_id")
    private UUID sessionId;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private CartStatus status = CartStatus.ACTIVE;

    @Builder.Default
    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(nullable = false, length = 3)
    private String currency = "USD";

    @Column(name = "expires_at")
    private Instant expiresAt;

    @Column(name = "converted_at")
    private Instant convertedAt;

    @OneToMany(mappedBy = "cart", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private Set<CartItemModel> items = new LinkedHashSet<>();

    public boolean isActive() {
        return status == CartStatus.ACTIVE;
    }

    public void addItem(CartItemModel item) {
        items.add(item);
        item.setCart(this);
    }

    public void removeItem(CartItemModel item) {
        items.remove(item);
        item.setCart(null);
    }
}
