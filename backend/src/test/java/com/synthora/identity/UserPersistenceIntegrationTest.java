package com.synthora.identity;

import com.synthora.SynthoraApplication;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest(classes = SynthoraApplication.class)
@ActiveProfiles("test")
class UserPersistenceIntegrationTest {

    @Test
    void contextLoads() {
    }
}