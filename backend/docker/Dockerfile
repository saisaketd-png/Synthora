# Multi-stage Dockerfile for Synthora Spring Boot Backend (Render & Production)

# Stage 1: Build stage
FROM maven:3.9.6-eclipse-temurin-21 AS build

WORKDIR /app

# Copy Maven descriptor and source code from repository root context
COPY backend/pom.xml ./pom.xml
COPY backend/src ./src

# Build production executable JAR (skipping test execution)
RUN mvn clean package -DskipTests

# Stage 2: Runtime stage
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Create non-root application user
RUN addgroup -S synthora && \
    adduser -S synthora -G synthora

# Create application storage directory and assign ownership
RUN mkdir -p /app/storage && \
    chown -R synthora:synthora /app

# Copy generated executable JAR from build stage
COPY --from=build /app/target/synthora-backend-*.jar app.jar

# Run application as non-root user
USER synthora:synthora

EXPOSE 8085

# Conservative heap configuration for container environments (e.g. Render 512MB RAM)
# Leaves ~128MB native headroom for metaspace, thread stacks, and OS overhead
ENV JAVA_TOOL_OPTIONS="-Xms128m -Xmx384m -XX:+ExitOnOutOfMemoryError"

ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]