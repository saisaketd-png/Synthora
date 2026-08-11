package com.synthora.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI synthoraOpenAPI() {

        final String securitySchemeName = "bearerAuth";

        return new OpenAPI()
                .info(new Info()
                        .title("Synthora B2B Marketplace API")
                        .description("Secure Spring Boot backend for a B2B pharmaceutical and chemical marketplace")
                        .version("v1.0.0")
                        .contact(new Contact()
                                .name("Saisaket Dhannure")
                                .email("saket@example.com")))
                .addSecurityItem(new SecurityRequirement()
                        .addList(securitySchemeName))
                .schemaRequirement(securitySchemeName,
                        new SecurityScheme()
                                .name(securitySchemeName)
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT"));
    }
}