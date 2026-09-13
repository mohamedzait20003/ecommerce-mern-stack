package com.minglemart.modules.catalog.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.minglemart.shared.common.ApiResponse;
import com.minglemart.shared.domain.BaseController;
import com.minglemart.modules.catalog.dtos.DealsResponse;
import com.minglemart.modules.catalog.services.DealService;

@RestController
@RequestMapping("/api/deals")
public class DealsController extends BaseController {

    private final DealService deals;

    public DealsController(DealService deals) {
        this.deals = deals;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<DealsResponse>> deals() {
        return ok("Deals loaded.", deals.dealsPage());
    }
}
