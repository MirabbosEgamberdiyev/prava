package uz.pravaimtihon.security;

import lombok.AllArgsConstructor;
import lombok.Data;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import uz.pravaimtihon.entity.User;
import uz.pravaimtihon.enums.AcceptLanguage;
import uz.pravaimtihon.enums.Role;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.Collections;

@Data
@AllArgsConstructor
public class CustomUserDetails implements UserDetails {

    private Long id;
    private String username; // phone or email
    private String password;
    private Role role;
    private AcceptLanguage language;
    private Boolean isActive;
    private Boolean accountLocked;
    private LocalDateTime accountLockedUntil;

    public static CustomUserDetails from(User user) {
        return new CustomUserDetails(
                user.getId(),
                resolveUsername(user),
                user.getPasswordHash(),
                user.getRole(),
                user.getPreferredLanguage(),
                user.getIsActive(),
                user.isAccountLocked(),
                user.getAccountLockedUntil()
        );
    }

    /**
     * Resolve a non-null unique username for JWT subject.
     * Priority: phoneNumber → email → telegramId → googleId → id
     */
    private static String resolveUsername(User user) {
        if (user.getPhoneNumber() != null) return user.getPhoneNumber();
        if (user.getEmail() != null) return user.getEmail();
        if (user.getTelegramId() != null) return user.getTelegramId();
        if (user.getGoogleId() != null) return user.getGoogleId();
        return String.valueOf(user.getId());
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return Collections.singletonList(
                new SimpleGrantedAuthority(role.getAuthority())
        );
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return username;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        if (accountLockedUntil == null) {
            return true;
        }
        return LocalDateTime.now().isAfter(accountLockedUntil);
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return isActive;
    }
}
