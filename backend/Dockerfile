# ── Stage 1: Build ─────────────────────────────────────────────────────────────
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /build
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
# Testlar CI'da (GitHub Actions) ishlaydi; image build'i tez va deterministik bo'lishi uchun o'tkaziladi.
RUN mvn clean package -DskipTests -B

# ── Stage 2: Run ───────────────────────────────────────────────────────────────
FROM eclipse-temurin:17-jre

# curl — docker-compose healthcheck uchun (JRE image'da kafolatlanmagan).
RUN apt-get update \
 && apt-get install -y --no-install-recommends curl \
 && rm -rf /var/lib/apt/lists/*

# SECURITY: ilova root sifatida ishlamaydi.
RUN groupadd --system --gid 10001 prava \
 && useradd --system --uid 10001 --gid prava --home-dir /app --shell /usr/sbin/nologin prava

WORKDIR /app
COPY --from=build --chown=prava:prava /build/target/*.jar app.jar
# Volume'lar (uploads, logs) yozilishi uchun egalik beriladi.
RUN mkdir -p /app/uploads /app/logs && chown -R prava:prava /app

USER prava
EXPOSE 8080

# Konteyner xotira limitiga moslashadi (default JVM heap konteyner limitini hisobga olmaydi).
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75 -XX:+ExitOnOutOfMemoryError -Djava.security.egd=file:/dev/./urandom"

HEALTHCHECK --interval=30s --timeout=5s --start-period=90s --retries=3 \
  CMD curl -fsS http://localhost:8080/actuator/health || exit 1

ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar /app/app.jar"]
