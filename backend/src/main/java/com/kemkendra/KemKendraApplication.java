package com.kemkendra;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;

@EnableMethodSecurity
@SpringBootApplication
public class KemKendraApplication {

    public static void main(String[] args) {
        SpringApplication.run(KemKendraApplication.class, args);
    }
}
