# KemKendra Backend

Enterprise B2B Chemical & Pharmaceutical Marketplace.

## Prerequisites

- Java 21
- Maven
- Docker & Docker Compose

## Getting Started

### 1. Environment Setup

Copy the example environment file:
`ash
cp .env.example .env
`

### 2. Start the Database

Run PostgreSQL and pgAdmin via Docker Compose:
`ash
docker-compose up -d
`

- PostgreSQL runs on localhost:5432
- pgAdmin runs on http://localhost:5050

### 3. Run the Application

Start the Spring Boot application (dev profile by default):
`ash
mvn spring-boot:run
`

## Useful Links

- **Swagger UI**: [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)
- **Actuator Health**: [http://localhost:8080/actuator/health](http://localhost:8080/actuator/health)
