# Multi-stage Dockerfile for KemKendra Spring Boot Backend (Render & Production)
# Stage 1: Build stage
FROM maven:3.9.6-eclipse-temurin-21-alpine AS build
WORKDIR /app

# Cache Maven dependencies layer
COPY backend/pom.xml ./pom.xml
RUN mvn dependency:go-offline -B || true

# Copy source code and build executable jar
COPY backend/src ./src
RUN mvn clean package -DskipTests -B

# Stage 2: Minimal runtime image
FROM eclipse-temurin:21-jre-alpine AS runner
WORKDIR /app

# Create non-root application user & group
RUN addgroup -S kemkendra && \
    adduser -S kemkendra -G kemkendra

# Create application storage directory and assign ownership
RUN mkdir -p /app/storage && \
    chown -R kemkendra:kemkendra /app

# Copy executable Spring Boot fat JAR
COPY --from=build --chown=kemkendra:kemkendra /app/target/kemkendra-backend-*.jar app.jar

# Run application as non-root user
USER kemkendra:kemkendra

EXPOSE 8085

# Memory heap configuration
ENV JAVA_TOOL_OPTIONS="-Xms128m -Xmx512m -XX:+ExitOnOutOfMemoryError"

ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]