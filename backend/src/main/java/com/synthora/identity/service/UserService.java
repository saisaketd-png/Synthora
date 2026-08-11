package com.synthora.identity.service;

import java.util.UUID;
import java.util.List;
import com.synthora.security.JwtService;
import com.synthora.identity.User;
import com.synthora.identity.UserRepository;
import com.synthora.identity.UserRole;
import com.synthora.identity.UserStatus;
import com.synthora.identity.dto.RegisterRequest;
import com.synthora.identity.dto.UserResponse;
import com.synthora.identity.dto.LoginRequest;
import com.synthora.identity.dto.LoginResponse;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.security.core.Authentication;


@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public UserService(UserRepository userRepository,
                   PasswordEncoder passwordEncoder,
                   JwtService jwtService) {
    this.userRepository = userRepository;
    this.passwordEncoder = passwordEncoder;
    this.jwtService = jwtService;
}

    public UserResponse register(RegisterRequest request) {

        if (userRepository.findByEmail(request.email()).isPresent()) {
            throw new IllegalArgumentException("Email already registered");
        }

        User user = new User();
        user.setName(request.name());
        user.setEmail(request.email());
        user.setPhone(request.phone());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(UserRole.USER);
        user.setStatus(UserStatus.ACTIVE);

        User saved = userRepository.save(user);

        return new UserResponse(
                saved.getId(),
                saved.getName(),
                saved.getEmail(),
                saved.getPhone(),
                saved.getRole(),
                saved.getStatus()
        );
    }
    public LoginResponse login(LoginRequest request) {

    User user = userRepository.findByEmail(request.email())
            .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));

    if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
        throw new IllegalArgumentException("Invalid email or password");
    }

   String token = jwtService.generateToken(user);

return new LoginResponse("Login successful", token);
    }
    public UserResponse getById(UUID id) {

        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        return new UserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole(),
                user.getStatus()
        );
    }
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll()
                .stream()
                .map(user -> new UserResponse(
                        user.getId(),
                        user.getName(),
                        user.getEmail(),
                        user.getPhone(),
                        user.getRole(),
                        user.getStatus()
                ))
                .toList();
    }
    public UserResponse getCurrentUser(Authentication authentication) {

    String email = authentication.getName();

    User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

    return new UserResponse(
            user.getId(),
            user.getName(),
            user.getEmail(),
            user.getPhone(),
            user.getRole(),
            user.getStatus()
    );
}
    
}