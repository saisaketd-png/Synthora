FROM eclipse-temurin:21-jdk

WORKDIR /app

COPY target/synthora-backend-1.0.0-SNAPSHOT.jar app.jar

EXPOSE 8085

ENTRYPOINT ["java", "-jar", "app.jar"]