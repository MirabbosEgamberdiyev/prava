package uz.pravaimtihon.entity;

/**
 * Ilova fayl formati/turi.
 */
public enum AppType {

    // ── Windows ──────────────────────────────────────────────────────────────
    /** NSIS installer (.exe) */
    WINDOWS_EXE,

    /** Microsoft Installer (.msi) */
    WINDOWS_MSI,

    // ── Linux ────────────────────────────────────────────────────────────────
    /** Debian/Ubuntu package (.deb) */
    LINUX_DEB,

    /** RedHat/Fedora package (.rpm) */
    LINUX_RPM,

    /** Portable AppImage (.AppImage) */
    LINUX_APPIMAGE,

    /** Gzipped tarball (.tar.gz) */
    LINUX_TARBALL,

    // ── macOS ────────────────────────────────────────────────────────────────
    /** Disk image (.dmg) */
    MACOS_DMG,

    /** macOS app bundle (.app.tar.gz) */
    MACOS_APP,

    // ── Web ──────────────────────────────────────────────────────────────────
    /** Progressive Web App */
    WEB_PWA,

    // ── Mobile ───────────────────────────────────────────────────────────────
    /** Android APK */
    ANDROID_APK,

    /** Android App Bundle */
    ANDROID_AAB,

    /** iOS IPA */
    IOS_IPA
}
