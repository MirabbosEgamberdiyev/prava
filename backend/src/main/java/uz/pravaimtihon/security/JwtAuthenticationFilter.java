package uz.pravaimtihon.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;
    private final CustomUserDetailsService userDetailsService;

    // ✅ Public endpoints list - JWT token talab qilinmaydi
    private static final List<String> PUBLIC_ENDPOINTS = Arrays.asList(
            "/api/v1/auth/register/init",
            "/api/v1/auth/register/complete",
            "/api/v1/auth/login",
            "/api/v1/auth/refresh",
            "/api/v1/auth/logout",
            "/api/v1/auth/forgot-password",
            "/api/v1/auth/reset-password",
            "/api/v1/auth/google",
            "/api/v1/auth/telegram",
            "/api/v1/auth/config",
            "/api/v1/public",
            "/swagger-ui",
            "/v3/api-docs",
            "/api-docs",
            "/swagger-resources",
            "/webjars",
            "/actuator/health",
            "/actuator/info",
            "/error"
    );

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        final String requestPath = request.getRequestURI();
        log.debug("Processing request: {} {}", request.getMethod(), requestPath);

        final String authHeader = request.getHeader("Authorization");

        // Tokenni headerdan yoki (download uchun) query paramdan olamiz.
        // Brauzerda nativ <a href="..."> orqali katta fayllarni yuklashda
        // header qo'shib bo'lmaydi — shuning uchun ?access_token=... ham qabul qilinadi.
        // B6/A2: query-paramdagi token faqat maxsus, qisqa muddatli "download" turidagi
        // token bo'lishi shart — asosiy (24 soatlik) access-token URL'da qabul qilinmaydi,
        // shunday qilib brauzer tarixi/proxy logida uzoq muddat amal qiladigan token qolmaydi.
        String jwt;
        boolean fromQueryParam = false;
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            jwt = authHeader.substring(7);
        } else {
            String queryToken = request.getParameter("access_token");
            if (queryToken != null && !queryToken.isBlank() && "GET".equalsIgnoreCase(request.getMethod())) {
                jwt = queryToken;
                fromQueryParam = true;
                log.debug("Using access_token from query param for: {}", requestPath);
            } else {
                log.debug("No valid Authorization header or query token for: {}", requestPath);
                filterChain.doFilter(request, response);
                return;
            }
        }

        boolean isDownloadToken = jwtTokenProvider.isDownloadToken(jwt);
        if (fromQueryParam != isDownloadToken) {
            // Query-paramda faqat download-token, header'da faqat oddiy access-token qabul qilinadi.
            log.warn("Rejected JWT: query-param usage requires a download-scoped token (path={})", requestPath);
            filterChain.doFilter(request, response);
            return;
        }
        log.debug("JWT token found, length: {}", jwt.length());

        try {
            final String userIdentifier = jwtTokenProvider.extractUsername(jwt);
            log.debug("Extracted username from token: {}", userIdentifier);

            // If token is valid and no authentication is set
            if (userIdentifier != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                log.debug("Loading user details for: {}", userIdentifier);

                UserDetails userDetails = userDetailsService.loadUserByUsername(userIdentifier);
                log.debug("User loaded successfully: {}", userDetails.getUsername());

                if (jwtTokenProvider.isTokenValid(jwt, userDetails)) {
                    log.debug("Token is valid for user: {}", userIdentifier);

                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            userDetails,
                            null,
                            userDetails.getAuthorities()
                    );
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);

                    log.info("User {} authenticated successfully", userIdentifier);
                } else {
                    log.warn("Token validation failed for user: {}", userIdentifier);
                }
            } else if (userIdentifier == null) {
                log.warn("Could not extract username from token");
            } else {
                log.debug("User already authenticated");
            }
        } catch (Exception e) {
            log.error("Cannot set user authentication: {} - {}", e.getClass().getSimpleName(), e.getMessage());
            // Don't throw exception, just log it and continue
        }

        filterChain.doFilter(request, response);
    }

    /**
     * ✅ FIXED: Faqat public endpointlar uchun filterni skip qilish
     * /api/v1/auth/me va /api/v1/auth/change-password JWT talab qiladi!
     */
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();

        // Check if path matches any public endpoint
        boolean shouldSkip = PUBLIC_ENDPOINTS.stream()
                .anyMatch(path::startsWith);

        if (shouldSkip) {
            log.debug("Skipping JWT filter for public endpoint: {}", path);
        } else {
            log.debug("JWT filter will process: {}", path);
        }

        return shouldSkip;
    }
}