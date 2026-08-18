package com.synthora.admin.user.api;

import com.synthora.admin.user.AdminUserService;
import com.synthora.admin.user.dto.AdminUserDetailResponse;
import com.synthora.admin.user.dto.AdminUserResponse;
import com.synthora.admin.user.dto.UpdateUserRoleRequest;
import com.synthora.admin.user.dto.UpdateUserStatusRequest;
import com.synthora.identity.UserRole;
import com.synthora.identity.UserStatus;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Controller exposing administrative user management APIs.
 * Strictly restricted to administrators via {@code @PreAuthorize("hasRole('ADMIN')")}.
 */
@RestController
@RequestMapping("/api/v1/admin/users")
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final AdminUserService adminUserService;

    public AdminUserController(AdminUserService adminUserService) {
        this.adminUserService = adminUserService;
    }

    @GetMapping
    public ResponseEntity<Page<AdminUserResponse>> getUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) UserRole role,
            @RequestParam(required = false) UserStatus status,
            @RequestParam(defaultValue = "false") boolean includeDeleted) {

        String effectiveQuery = (query != null && !query.trim().isEmpty()) ? query : q;
        Page<AdminUserResponse> users = adminUserService.getUsers(page, size, effectiveQuery, role, status, includeDeleted);
        return ResponseEntity.ok(users);
    }

    @GetMapping("/{id}")
    public ResponseEntity<AdminUserDetailResponse> getUserDetail(@PathVariable UUID id) {
        return ResponseEntity.ok(adminUserService.getUserDetail(id));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<AdminUserResponse> updateUserStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateUserStatusRequest request,
            Authentication authentication,
            HttpServletRequest servletRequest) {

        return ResponseEntity.ok(adminUserService.updateUserStatus(id, request, authentication, servletRequest));
    }

    @PutMapping("/{id}/role")
    public ResponseEntity<AdminUserResponse> updateUserRole(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateUserRoleRequest request,
            Authentication authentication,
            HttpServletRequest servletRequest) {

        return ResponseEntity.ok(adminUserService.updateUserRole(id, request, authentication, servletRequest));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<AdminUserResponse> deleteUser(
            @PathVariable UUID id,
            Authentication authentication,
            HttpServletRequest servletRequest) {

        return ResponseEntity.ok(adminUserService.softDeleteUser(id, authentication, servletRequest));
    }
}
