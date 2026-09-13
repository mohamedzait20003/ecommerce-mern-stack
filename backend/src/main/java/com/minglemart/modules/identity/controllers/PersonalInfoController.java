package com.minglemart.modules.identity.controllers;

import java.util.UUID;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.minglemart.modules.identity.dtos.PersonalInfoRequest;
import com.minglemart.modules.identity.dtos.PersonalInfoResponse;
import com.minglemart.modules.identity.models.UserModel;
import com.minglemart.modules.identity.services.UserService;
import com.minglemart.shared.common.ApiResponse;
import com.minglemart.shared.domain.AuthUser;
import com.minglemart.shared.domain.BaseController;

@RestController
@RequestMapping("/api/profile/personal")
public class PersonalInfoController extends BaseController {
    private final UserService users;

    public PersonalInfoController(UserService users) {
        this.users = users;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PersonalInfoResponse>> mine(@AuthUser UUID userId) {
        UserModel user = users.getOrThrow(userId);

        return ok("Details loaded.", PersonalInfoResponse.from(user));
    }

    @PatchMapping
    public ResponseEntity<ApiResponse<PersonalInfoResponse>> update(@AuthUser UUID userId, @Valid @RequestBody PersonalInfoRequest request) {
        UserModel updated = users.update(userId, user -> {
            if (request.fname() != null)
                user.setFname(request.fname().trim());
            
            if (request.lname() != null)
                user.setLname(request.lname().trim());
            
            if (request.gender() != null)
                user.setGender(request.gender());
            
            if (request.dateOfBirth() != null)
                user.setDateOfBirth(request.dateOfBirth());
            
            if (request.locale() != null)
                user.setLocale(request.locale());
            
            if (request.timeZone() != null)
                user.setTimeZone(request.timeZone());
        });

        return ok("Details updated.", PersonalInfoResponse.from(updated));
}
}
