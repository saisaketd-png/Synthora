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

# Stage 2: Extract Spring Boot layered jar
FROM eclipse-temurin:21-jre-alpine AS extractor
WORKDIR /app
COPY --from=build /app/target/kemkendra-backend-*.jar app.jar
RUN java -Djarmode=tools -jar app.jar extract --layers --destination extracted || \
    java -Djarmode=layertools -jar app.jar extract --destination extracted

# Stage 3: Minimal runtime image
FROM eclipse-temurin:21-jre-alpine AS runner
WORKDIR /app

# Create non-root application user & group
RUN addgroup -S kemkendra && \
    adduser -S kemkendra -G kemkendra

# Create application storage directory and assign ownership
RUN mkdir -p /app/storage && \
    chown -R kemkendra:kemkendra /app

# Copy layered components
COPY --from=extractor --chown=kemkendra:kemkendra /app/extracted/dependencies/ ./
COPY --from=extractor --chown=kemkendra:kemkendra /app/extracted/spring-boot-loader/ ./
COPY --from=extractor --chown=kemkendra:kemkendra /app/extracted/snapshot-dependencies/ ./
COPY --from=extractor --chown=kemkendra:kemkendra /app/extracted/application/ ./

# Run application as non-root user
USER kemkendra:kemkendra

EXPOSE 8085

# Conservative heap configuration for container environments (e.g. Render Free 512MB RAM)
# Allocates 256MB max heap leaving ~256MB native headroom for metaspace, thread stacks, and OS overhead
ENV JAVA_TOOL_OPTIONS="-Xms96m -Xmx256m -XX:+ExitOnOutOfMemoryError"

ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "org.springframework.boot.loader.launch.JarLauncher"]