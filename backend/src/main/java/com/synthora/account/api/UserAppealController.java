package com.synthora.account.api;

import com.synthora.account.UserAppealService;
import com.synthora.account.dto.AppealResponseRequest;
import com.synthora.account.dto.SubmitAppealRequest;
import com.synthora.account.dto.UserAppealResponse;
import com.synthora.account.dto.UserSuspensionDetailResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/account")
public class UserAppealController {

    private final UserAppealService appealService;

    public UserAppealController(UserAppealService appealService) {
        this.appealService = appealService;
    }

    @GetMapping("/suspension")
    public ResponseEntity<UserSuspensionDetailResponse> getMySuspension(Authentication authentication) {
        return ResponseEntity.ok(appealService.getMySuspensionDetail(authentication));
    }

    @GetMapping("/appeals")
    public ResponseEntity<List<UserAppealResponse>> getMyAppeals(Authentication authentication) {
        return ResponseEntity.ok(appealService.getMyAppeals(authentication));
    }

    @GetMapping("/appeals/{id}")
    public ResponseEntity<UserAppealResponse> getMyAppealDetail(
            @PathVariable UUID id,
            Authentication authentication) {
        return ResponseEntity.ok(appealService.getMyAppealDetail(id, authentication));
    }

    @PostMapping("/appeals")
    public ResponseEntity<UserAppealResponse> submitAppeal(
            @Valid @RequestBody SubmitAppealRequest request,
            Authentication authentication,
            HttpServletRequest servletRequest) {

        UserAppealResponse response = appealService.submitAppeal(request, authentication, servletRequest);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/appeals/{id}/response")
    public ResponseEntity<UserAppealResponse> respondToInformationRequest(
            @PathVariable UUID id,
            @Valid @RequestBody AppealResponseRequest request,
            Authentication authentication,
            HttpServletRequest servletRequest) {

        return ResponseEntity.ok(appealService.respondToInformationRequest(id, request, authentication, servletRequest));
    }
}
