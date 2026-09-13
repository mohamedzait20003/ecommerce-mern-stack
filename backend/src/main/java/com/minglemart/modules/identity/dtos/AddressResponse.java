package com.minglemart.modules.identity.dtos;

import java.util.UUID;

import com.minglemart.modules.identity.models.AddressModel;

/** An address as the delivery screens read it. */
public record AddressResponse(
        UUID id,
        String label,
        String recipientName,
        String line1,
        String line2,
        String city,
        String region,
        String postalCode,
        String countryCode,
        String phone,
        boolean isDefault) {

    public static AddressResponse from(AddressModel address) {
        return new AddressResponse(
                address.getId(),
                address.getLabel(),
                address.getRecipientName(),
                address.getLine1(),
                address.getLine2(),
                address.getCity(),
                address.getRegion(),
                address.getPostalCode(),
                address.getCountryCode(),
                address.getPhone(),
                address.isDefault());
    }
}
