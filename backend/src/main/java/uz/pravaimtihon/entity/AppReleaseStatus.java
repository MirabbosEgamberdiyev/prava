package uz.pravaimtihon.entity;

/**
 * Ilova relizining holati.
 *
 * <pre>
 *  DRAFT ──▶ ACTIVE ──▶ DEPRECATED
 *                  ╚──▶ YANKED
 * </pre>
 */
public enum AppReleaseStatus {

    /** Tayyorlanmoqda — foydalanuvchilarga ko'rinmaydi */
    DRAFT,

    /** Faol — yuklab olish uchun mavjud */
    ACTIVE,

    /** Eskirgan — hali yuklab olish mumkin, lekin yangi versiya bor */
    DEPRECATED,

    /** Yechib olindi — muammo tufayli yuklab olish taqiqlangan */
    YANKED
}
