package com.synthora.identity.api;

import com.synthora.identity.dto.RegisterRequest;
import com.synthora.identity.dto.SupplierRegisterRequest;
import com.synthora.identity.dto.UserResponse;
import com.synthora.identity.dto.LoginRequest;
import com.synthora.identity.dto.LoginResponse;
import jakarta.validation.Valid;
import com.synthora.identity.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final UserService userService;

    public AuthController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser(
            Authentication authentication) {

        UserResponse response = userService.getCurrentUser(authentication);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(
            @Valid @RequestBody RegisterRequest request) {

        UserResponse response = userService.register(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @PostMapping("/register/supplier")
    public ResponseEntity<LoginResponse> registerSupplier(
            @Valid @RequestBody SupplierRegisterRequest request) {

        LoginResponse response = userService.registerSupplier(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(
            @Valid @RequestBody LoginRequest request,
            jakarta.servlet.http.HttpServletRequest servletRequest) {

        String ip = servletRequest.getHeader("X-Forwarded-For");
        if (ip == null || ip.isBlank()) {
            ip = servletRequest.getRemoteAddr();
        } else if (ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }

        LoginResponse response = userService.login(request, ip);
        return ResponseEntity.ok(response);
    }
}
