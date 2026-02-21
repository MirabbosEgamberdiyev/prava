package uz.pravaimtihon.enums;
public enum Role {
    SUPER_ADMIN,
    ADMIN,
    USER;

    public String getAuthority() {
        return "ROLE_" + this.name();
    }
}