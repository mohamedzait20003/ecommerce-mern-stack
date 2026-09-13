package com.minglemart.modules.identity.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * A shipping or billing address, as submitted.
 *
 * <p>Used for both create and replace. Unlike the preference endpoints this is a
 * full representation rather than a patch: an address with half its lines
 * missing is not a partial update, it is an undeliverable address.
 */
public record AddressRequest(

        @Size(max = 64, message = "Label may not exceed 64 characters.")
        String label,

        @NotBlank(message = "A recipient name is required.")
        String recipientName,

        @NotBlank(message = "The first address line is required.")
        String line1,

        String line2,

        @NotBlank(message = "A city is required.")
        String city,

        String region,

        @Size(max = 32, message = "Postal code may not exceed 32 characters.")
        String postalCode,

        /* char(2) in the schema, so the length is not negotiable. */
        @NotBlank(message = "A country is required.")
        @Pattern(regexp = "^[A-Za-z]{2}$", message = "Country must be a 2-letter ISO code.")
        String countryCode,

        String phone,

        /** Make this the address orders go to. Boxed: absent means "leave it alone". */
        Boolean isDefault) {

    /** Normalised on the way in so {@code gb} and {@code GB} are not two countries. */
    public String normalisedCountryCode() {
        return countryCode == null ? null : countryCode.toUpperCase();
    }
}
