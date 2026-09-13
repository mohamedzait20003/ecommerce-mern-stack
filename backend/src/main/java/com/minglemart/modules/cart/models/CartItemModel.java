package com.minglemart.modules.cart.models;

import lombok.*;
import java.util.UUID;
import java.math.BigDecimal;
import jakarta.persistence.*;
import org.hibernate.type.SqlTypes;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.JdbcTypeCode;

import com.minglemart.shared.common.Money;
import com.minglemart.shared.common.ActorType;
import com.minglemart.shared.domain.BaseModel;

@Entity
@Table(name = "cart_items")
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class CartItemModel extends BaseModel {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cart_id", nullable = false)
    private CartModel cart;

    @Column(name = "variant_id", nullable = false)
    private UUID variantId;

    @Column(nullable = false, precision = 12, scale = 3)
    private BigDecimal quantity;

    @Column(name = "unit_price_amount", nullable = false, precision = 19, scale = 4)
    private BigDecimal unitPriceAmount;

    @Builder.Default
    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(nullable = false, length = 3)
    private String currency = "USD";

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "actor_type", nullable = false, length = 16)
    private ActorType actorType = ActorType.USER;

    public Money unitPrice() {
        return new Money(unitPriceAmount, currency);
    }
}
