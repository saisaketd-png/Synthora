package com.synthora.admin.analytics.api;

import com.synthora.admin.analytics.AdminAnalyticsService;
import com.synthora.admin.analytics.dto.AdminAnalyticsOverviewResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/analytics")
@PreAuthorize("hasRole('ADMIN')")
public class AdminAnalyticsController {

    private final AdminAnalyticsService analyticsService;

    public AdminAnalyticsController(AdminAnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping("/overview")
    public ResponseEntity<AdminAnalyticsOverviewResponse> getOverview(
            @RequestParam(defaultValue = "30d") String period,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to
    ) {
        return ResponseEntity.ok(analyticsService.getOverview(period, from, to));
    }
}
