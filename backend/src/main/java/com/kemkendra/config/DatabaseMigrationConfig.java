package com.kemkendra.config;

import org.flywaydb.core.Flyway;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;

@Configuration
public class DatabaseMigrationConfig {

    private static final Logger log = LoggerFactory.getLogger(DatabaseMigrationConfig.class);

    @Bean
    public Flyway flyway(DataSource dataSource,
                         @Value("${spring.flyway.enabled:true}") boolean enabled) {
        if (!enabled) {
            log.info("Flyway database migration is explicitly disabled via spring.flyway.enabled=false");
            return null;
        }

        log.info("Executing Flyway database migrations against target database...");
        Flyway flyway = Flyway.configure()
                .dataSource(dataSource)
                .locations("classpath:db/migration")
                .baselineOnMigrate(true)
                .baselineVersion("0")
                .validateOnMigrate(false)
                .outOfOrder(true)
                .load();

        var result = flyway.migrate();
        log.info("Flyway migration completed successfully. Applied {} migrations. Current schema version: {}",
                result.migrationsExecuted,
                result.targetSchemaVersion);

        return flyway;
    }
}
