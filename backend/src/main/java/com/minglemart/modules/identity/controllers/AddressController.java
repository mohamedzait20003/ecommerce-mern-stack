package com.minglemart.modules.identity.controllers;

import java.util.List;
import java.util.UUID;

import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.minglemart.modules.identity.dtos.AddressRequest;
import com.minglemart.modules.identity.dtos.AddressResponse;
import com.minglemart.modules.identity.models.AddressModel;
import com.minglemart.modules.identity.models.UserModel;
import com.minglemart.modules.identity.services.AddressService;
import com.minglemart.modules.identity.services.UserService;
import com.minglemart.shared.common.ApiResponse;
import com.minglemart.shared.domain.Authorize;
import com.minglemart.shared.domain.AuthUser;
import com.minglemart.shared.domain.BaseController;


@RestController
@RequestMapping("/api/profile/addresses")
@Authorize(session = true)
public class AddressController extends BaseController {

    private final AddressService addresses;
    private final UserService users;

    public AddressController(AddressService addresses, UserService users) {
        this.addresses = addresses;
        this.users = users;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<AddressResponse>>> mine(@AuthUser UUID userId) {
        List<AddressResponse> all = addresses.forUser(userId).stream().map(AddressResponse::from).toList();

        return ok("Addresses loaded.", all);
    }

    @PostMapping
    public ResponseEntity<ApiResponse<AddressResponse>> add(@AuthUser UUID userId, @Valid @RequestBody AddressRequest request) {

        UserModel user = users.getOrThrow(userId);
        AddressModel saved = addresses.createFor(user, apply(new AddressModel(), request));

        return created("Address saved.", AddressResponse.from(saved), saved.getId());
    }

    @PutMapping("/{addressId}")
    public ResponseEntity<ApiResponse<AddressResponse>> replace(@AuthUser UUID userId, @PathVariable UUID addressId, @Valid @RequestBody AddressRequest request) {
        requireOwned(userId, addressId);

        AddressModel updated = addresses.update(addressId, address -> apply(address, request));

        if (Boolean.TRUE.equals(request.isDefault())) {
            updated = addresses.makeDefault(userId, addressId);
        }

        return ok("Address updated.", AddressResponse.from(updated));
    }

    /** The address orders go to unless the shopper picks another at checkout. */
    @PostMapping("/{addressId}/default")
    public ResponseEntity<ApiResponse<AddressResponse>> makeDefault(@AuthUser UUID userId, @PathVariable UUID addressId) {
        requireOwned(userId, addressId);

        return ok("Default address set.", AddressResponse.from(addresses.makeDefault(userId, addressId)));
    }

    @DeleteMapping("/{addressId}")
    public ResponseEntity<ApiResponse<Void>> remove(@AuthUser UUID userId, @PathVariable UUID addressId) {

        requireOwned(userId, addressId);
        addresses.softDelete(addressId);

        return ok("Address removed.");
    }

    private AddressModel apply(AddressModel address, AddressRequest request) {
        address.setLabel(request.label());
        address.setRecipientName(request.recipientName());
        address.setLine1(request.line1());
        address.setLine2(request.line2());
        address.setCity(request.city());
        address.setRegion(request.region());
        address.setPostalCode(request.postalCode());
        address.setCountryCode(request.normalisedCountryCode());
        address.setPhone(request.phone());

        return address;
    }

    /** 404 rather than 403: whether an id exists is not the caller's business. */
    private void requireOwned(UUID userId, UUID addressId) {
        addresses.forUser(userId, addressId).orElseThrow(() -> new EntityNotFoundException("Address not found."));
    }


}
