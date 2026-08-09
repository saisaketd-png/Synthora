package com.synthora.identity;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import java.util.UUID;
import java.util.Optional;
import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("dev")
public class UserPersistenceIntegrationTest {

    @Autowired
    private UserRepository userRepository;

    @Test
    public void testSaveAndReadUser() {
        // Arrange
        User user = new User(
            UUID.randomUUID(),
            "John Doe",
            "john.doe@example.com",
            "+1234567890",
            "hashedpassword123",
            UserRole.USER,
            UserStatus.ACTIVE
        );

        // Act
        User savedUser = userRepository.save(user);

        // Assert
        assertThat(savedUser.getId()).isNotNull();
        
        Optional<User> foundUserOpt = userRepository.findById(savedUser.getId());
        assertThat(foundUserOpt).isPresent();
        
        User foundUser = foundUserOpt.get();
        assertThat(foundUser.getName()).isEqualTo("John Doe");
        assertThat(foundUser.getEmail()).isEqualTo("john.doe@example.com");
        assertThat(foundUser.getRole()).isEqualTo(UserRole.USER);
        assertThat(foundUser.getStatus()).isEqualTo(UserStatus.ACTIVE);
        assertThat(foundUser.getCreatedAt()).isNotNull();
        assertThat(foundUser.getUpdatedAt()).isNotNull();

        // Clean up
        userRepository.delete(foundUser);
    }
}
