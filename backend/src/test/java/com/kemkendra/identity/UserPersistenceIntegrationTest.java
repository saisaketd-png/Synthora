package com.kemkendra.identity;

import com.kemkendra.KemKendraApplication;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest(classes = KemKendraApplication.class)
@ActiveProfiles("test")
class UserPersistenceIntegrationTest {

    @Test
    void contextLoads() {
    }
}