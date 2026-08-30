package com.synthora.identity.api;

import com.synthora.identity.dto.ChangePasswordRequest;
import com.synthora.identity.dto.ChangePasswordResponse;
import com.synthora.identity.dto.UpdateProfileRequest;
import com.synthora.identity.dto.UserResponse;
import com.synthora.identity.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/{id}")
    public UserResponse getUser(@PathVariable UUID id) {
        return userService.getById(id);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public List<UserResponse> getAllUsers() {
        return userService.getAllUsers();
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> me(Authentication authentication) {
        UserResponse response = userService.getCurrentUser(authentication);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/me")
    public ResponseEntity<UserResponse> updateProfile(
            Authentication authentication,
            @Valid @RequestBody UpdateProfileRequest request) {
        UserResponse response = userService.updateProfile(authentication, request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/me/change-password")
    public ResponseEntity<ChangePasswordResponse> changePassword(
            Authentication authentication,
            @Valid @RequestBody ChangePasswordRequest request) {
        ChangePasswordResponse response = userService.changePassword(authentication, request);
        return ResponseEntity.ok(response);
    }
}
