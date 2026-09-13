package uz.pravaimtihon.enums;
public enum Role {
    SUPER_ADMIN,
    ADMIN,
    CONTENT_MANAGER,
    SUPPORT,
    ANALYST,
    USER;

    public String getAuthority() {
        return "ROLE_" + this.name();
    }
}