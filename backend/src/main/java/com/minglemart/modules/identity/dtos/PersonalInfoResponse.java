package com.minglemart.modules.identity.dtos;

import java.time.LocalDate;

import com.minglemart.modules.identity.models.UserModel;
import com.minglemart.shared.enums.Gender;

/**
 * The account details screen.
 *
 * <p>Carries the read-only identifiers ({@code email}, {@code username},
 * {@code verified}) alongside the editable fields, so the page can render both
 * without a second call. No password hash and no role permissions.
 */
public record PersonalInfoResponse(
        String username,
        String email,
        String fname,
        String lname,
        String displayName,
        Gender gender,
        LocalDate dateOfBirth,
        String locale,
        String timeZone,
        String profilePicUrl,
        boolean verified) {

    public static PersonalInfoResponse from(UserModel user) {
        return new PersonalInfoResponse(
                user.getUsername(),
                user.getEmail(),
                user.getFname(),
                user.getLname(),
                user.displayName(),
                user.getGender(),
                user.getDateOfBirth(),
                user.getLocale(),
                user.getTimeZone(),
                user.getProfilePicUrl(),
                user.isVerified());
    }
}
