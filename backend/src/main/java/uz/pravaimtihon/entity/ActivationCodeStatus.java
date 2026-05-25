package uz.pravaimtihon.entity;

/**
 * Lifecycle status of a desktop activation code.
 *
 * <ul>
 *   <li>ACTIVE      — valid, not yet expired, not revoked</li>
 *   <li>EXPIRING    — active but expires within 3 days (computed view, not stored)</li>
 *   <li>EXPIRED     — end date is in the past</li>
 *   <li>DEACTIVATED — manually revoked by a SUPER_ADMIN</li>
 * </ul>
 *
 * Only ACTIVE / EXPIRED / DEACTIVATED are persisted in the database column.
 * EXPIRING is derived at query time and returned in response DTOs.
 */
public enum ActivationCodeStatus {
    ACTIVE,
    EXPIRED,
    DEACTIVATED
}
