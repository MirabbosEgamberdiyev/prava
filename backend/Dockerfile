FROM eclipse-temurin:17-jre
WORKDIR /app

# target papkasidagi yaratilgan .jar faylni olamiz
COPY target/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java","-jar","/app/app.jar"]