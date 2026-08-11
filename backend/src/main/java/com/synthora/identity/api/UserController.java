package com.synthora.identity.api;

import com.synthora.identity.dto.UserResponse;
import com.synthora.identity.service.UserService;
import com.synthora.identity.dto.UserResponse;
import com.synthora.identity.service.UserService;
import org.springframework.security.core.Authentication;

import org.springframework.http.ResponseEntity;
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

    @GetMapping("/{id}")
    public UserResponse getUser(@PathVariable UUID id) {
        return userService.getById(id);
    }

    @GetMapping
    public List<UserResponse> getAllUsers() {
        return userService.getAllUsers();
    }
    @GetMapping("/me")
public ResponseEntity<UserResponse> me(Authentication authentication) {

    UserResponse response = userService.getCurrentUser(authentication);

    return ResponseEntity.ok(response);
}
}
