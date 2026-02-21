package uz.pravaimtihon.security;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import org.springframework.beans.factory.annotation.Value;

import java.util.Arrays;
import java.util.List;

/**
 * ✅ FIXED: Security Configuration with Google OAuth Public Access
 *
 * Changes:
 * - /api/v1/auth/google is now PUBLIC (line 63)
 * - All other auth endpoints remain PUBLIC
 * - File access permissions unchanged
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true, securedEnabled = true)
@RequiredArgsConstructor
@Slf4j
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final CustomUserDetailsService userDetailsService;
    private final JwtAuthenticationEntryPoint authenticationEntryPoint;

    @Value("${app.security.allowed-origins:https://pravaonline.uz,https://www.pravaonline.uz,https://admin.pravaonline.uz,http://localhost:3000,http://localhost:5173,http://localhost:5174,http://localhost:8080,http://127.0.0.1:3000,http://127.0.0.1:5173,http://127.0.0.1:5174,http://127.0.0.1:8080}")
    private String allowedOrigins;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        log.info("✅ Configuring Security Filter Chain with Google OAuth");

        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .authorizeHttpRequests(auth -> auth
                        // ============================================
                        // PUBLIC ENDPOINTS - NO AUTHENTICATION
                        // ============================================
                        .requestMatchers(
                                // ✅ ALL AUTH ENDPOINTS (including Google)
                                "/api/v1/auth/**",
                                "/api/v1/public/**",
                                "/api/v1/telegram/webhook",

                                // Static resources (Test Dashboard, etc.)
                                "/",
                                "/index.html",
                                "/test-dashboard.html",
                                "/*.html",
                                "/*.css",
                                "/*.js",
                                "/static/**",
                                "/favicon.ico",

                                // Swagger
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/v3/api-docs/**",
                                "/api-docs/**",
                                "/swagger-resources/**",
                                "/webjars/**",

                                // Actuator
                                "/actuator/health",
                                "/actuator/info",
                                "/error"
                        ).permitAll()

                        // ============================================
                        // FILE ACCESS - PROPER ORDER & PATTERNS
                        // ============================================

                        // 1️⃣ Profile images - PUBLIC (anyone can view)
                        .requestMatchers(HttpMethod.GET, "/api/v1/files/profiles/**")
                        .permitAll()

                        // 2️⃣ General files - PUBLIC (anyone can view)
                        .requestMatchers(HttpMethod.GET, "/api/v1/files/general/**")
                        .permitAll()

                        // 3️⃣ Question image by ID - PROTECTED (before wildcard)
                        .requestMatchers(HttpMethod.GET, "/api/v1/files/questions/by-id/**")
                        .hasAnyRole("SUPER_ADMIN", "ADMIN", "USER")

                        // 4️⃣ Question images by filename - PROTECTED (requires active exam)
                        .requestMatchers(HttpMethod.GET, "/api/v1/files/questions/**")
                        .hasAnyRole("SUPER_ADMIN", "ADMIN", "USER")

                        // 5️⃣ File metadata, utilities, downloads - ADMIN ONLY
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/v1/files/metadata",
                                "/api/v1/files/list/**",
                                "/api/v1/files/exists/**",
                                "/api/v1/files/storage-type",
                                "/api/v1/files/download/**"
                        ).hasAnyRole("SUPER_ADMIN", "ADMIN")

                        // 6️⃣ File UPLOAD - ADMIN ONLY
                        .requestMatchers(HttpMethod.POST, "/api/v1/files/**")
                        .hasAnyRole("SUPER_ADMIN", "ADMIN")

                        // 6.5️⃣ File UPDATE - ADMIN ONLY
                        .requestMatchers(HttpMethod.PUT, "/api/v1/files/**")
                        .hasAnyRole("SUPER_ADMIN", "ADMIN")

                        // 7️⃣ File DELETE - ADMIN ONLY
                        .requestMatchers(HttpMethod.DELETE, "/api/v1/files/**")
                        .hasAnyRole("SUPER_ADMIN", "ADMIN")

                        // ============================================
                        // SUPER_ADMIN ONLY
                        // ============================================
                        .requestMatchers("/api/v1/admin/users/admins/**").hasRole("SUPER_ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/v1/admin/users").hasRole("SUPER_ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/v1/admin/users/*/role").hasRole("SUPER_ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/v1/admin/users/**").hasRole("SUPER_ADMIN")

                        // ============================================
                        // USER-accessible topic endpoints (BEFORE admin catch-all)
                        // ============================================
                        .requestMatchers(HttpMethod.GET,
                                "/api/v1/admin/topics/with-questions",
                                "/api/v1/admin/topics/active",
                                "/api/v1/admin/topics/simple",
                                "/api/v1/admin/topics/code/**"
                        ).hasAnyRole("SUPER_ADMIN", "ADMIN", "USER")

                        // ============================================
                        // ADMIN + SUPER_ADMIN
                        // ============================================
                        .requestMatchers("/api/v1/admin/**").hasAnyRole("SUPER_ADMIN", "ADMIN")

                        // ============================================
                        // USER + ADMIN + SUPER_ADMIN
                        // ============================================
                        .requestMatchers("/api/v1/user/**", "/api/v1/exam/**",
                                "/api/v1/exams/**", "/api/v2/exams/**", "/api/v1/statistics/**")
                        .hasAnyRole("SUPER_ADMIN", "ADMIN", "USER")

                        // All other requests require authentication
                        .anyRequest().authenticated()
                )
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint(authenticationEntryPoint)
                );

        log.info("✅ Security configuration complete - Google OAuth is PUBLIC");
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        List<String> origins = Arrays.asList(allowedOrigins.split(","));
        log.info("Configuring CORS with allowed origins: {}", origins);

        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(origins);
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "Accept", "Accept-Language", "X-Requested-With"));
        configuration.setExposedHeaders(Arrays.asList("Authorization", "X-Total-Count", "Content-Disposition", "X-Request-Id"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }
}