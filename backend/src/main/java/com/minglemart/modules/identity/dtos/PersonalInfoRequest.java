package com.minglemart.modules.identity.dtos;

import java.time.LocalDate;

import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Size;

import com.minglemart.shared.enums.Gender;

/**
 * A partial update of the shopper's own details.
 *
 * <p>Every field is nullable and null means "leave it alone", matching
 * {@link CustomerProfileRequest}. Email and username are absent on purpose: both
 * are identifiers other things key on, and changing an email has to re-verify it
 * rather than silently move the account.
 */
public record PersonalInfoRequest(

        @Size(min = 1, max = 100, message = "First name must be 1 to 100 characters.")
        String fname,

        @Size(min = 1, max = 100, message = "Last name must be 1 to 100 characters.")
        String lname,

        Gender gender,

        @Past(message = "Date of birth must be in the past.")
        LocalDate dateOfBirth,

        @Size(max = 10, message = "Locale must be a short tag such as en or en-GB.")
        String locale,

        @Size(max = 64, message = "Time zone must be an IANA name such as Europe/London.")
        String timeZone) {
}
