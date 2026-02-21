package uz.pravaimtihon.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                // -----------------------------------------------------------
                //  ENG MUHIM JOYI:
                //  Faqat bitta "/" server qo'shildi.
                //  Bu hamma joyda (Local, VPS, Domen) avtomatik ishlaydi.
                // -----------------------------------------------------------
                .servers(List.of(
                        new Server().url("/").description("Server (Avtomatik aniqlash)")
                ))
                .info(new Info()
                        .title("Prava Online API")
                        .version("1.0.0")
                        .description("Professional Driving License Exam Platform API Documentation")
                        .contact(new Contact()
                                .name("Prava Online Team")
                                .email("support@pravaimtihon.uz")
                                .url("https://pravaimtihon.uz"))
                        .license(new License()
                                .name("Apache 2.0")
                                .url("https://www.apache.org/licenses/LICENSE-2.0.html")))
                .addSecurityItem(new SecurityRequirement().addList("bearer-jwt"))
                .components(new Components()
                        .addSecuritySchemes("bearer-jwt", new SecurityScheme()
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("JWT Authorization header using the Bearer scheme. Example: \"Bearer {token}\"")
                                .in(SecurityScheme.In.HEADER)
                                .name("Authorization")));
    }
}