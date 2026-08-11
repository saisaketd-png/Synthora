package com.synthora.admin.api;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin")
public class AdminController {

    @GetMapping("/ping")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> ping() {
        return ResponseEntity.ok("Admin access granted");
    }
}