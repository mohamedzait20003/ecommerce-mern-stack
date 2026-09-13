package com.minglemart.modules.identity.models;

import lombok.*;
import java.util.Set;
import java.util.HashSet;
import jakarta.persistence.*;
import lombok.experimental.SuperBuilder;
import org.hibernate.type.SqlTypes;
import org.hibernate.annotations.JdbcTypeCode;

import com.minglemart.shared.domain.SoftDeletableModel;

@Entity
@Table(name = "addresses")
@Getter @Setter @SuperBuilder
@NoArgsConstructor @AllArgsConstructor
public class AddressModel extends SoftDeletableModel {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private UserModel user;

    @Column(length = 64)
    private String label;

    @Column(nullable = false)
    private String recipientName;

    @Column(nullable = false)
    private String line1;
    private String line2;

    @Column(nullable = false)
    private String city;
    private String region;

    @Column(length = 32)
    private String postalCode;

    // JdbcTypeCode, not just columnDefinition: the column is char(2), and
    // without this Hibernate maps String to VARCHAR and schema validation
    // fails on the type code against bpchar.
    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(nullable = false, length = 2)
    private String countryCode;

    private String phone;

    /**
      * The one an order uses unless the shopper picks another. At most one per
      * user, which a partial unique index enforces — so setting a new default
      * has to clear the old one first.
      */
    @Builder.Default
    @Column(name = "is_default")
    private boolean isDefault = false;
}
