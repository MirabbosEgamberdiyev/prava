// ─── Enums ────────────────────────────────────────────────────────────────────

export type AppPlatform =
  | "WINDOWS"
  | "LINUX"
  | "MACOS"
  | "WEB"
  | "ANDROID"
  | "IOS";

export type AppType =
  | "WINDOWS_EXE"
  | "WINDOWS_MSI"
  | "LINUX_DEB"
  | "LINUX_RPM"
  | "LINUX_APPIMAGE"
  | "LINUX_TARBALL"
  | "MACOS_DMG"
  | "MACOS_APP"
  | "WEB_PWA"
  | "ANDROID_APK"
  | "ANDROID_AAB"
  | "IOS_IPA";

export type AppReleaseStatus =
  | "DRAFT"
  | "ACTIVE"
  | "DEPRECATED"
  | "YANKED";

// ─── DTOs ─────────────────────────────────────────────────────────────────────

/** Ilova ishlashi turi: ONLINE — server bilan, OFFLINE — internetsiz */
export type AppCategory = "ONLINE" | "OFFLINE";

export interface AppReleaseResponse {
  id:                   number;
  appName:              string;
  appCategory?:         AppCategory;
  platform:             AppPlatform;
  appType:              AppType;
  version:              string;
  versionCode:          number;
  status:               AppReleaseStatus;
  isLatest:             boolean;
  isForceUpdate:        boolean;
  minSupportedVersion?: string;
  releaseNotesUzl?:     string;
  releaseNotesUzc?:     string;
  releaseNotesRu?:      string;
  releaseNotesEn?:      string;
  releaseDate?:         string;
  downloadUrl?:         string;
  fileSize?:            number;
  fileSizeFormatted?:   string;
  checksum?:            string;
  downloadCount:        number;
}

// ─── UI helpers ───────────────────────────────────────────────────────────────

export interface PlatformMeta {
  label:    string;
  emoji:    string;
  color:    string;
  gradient: string;
}

export const PLATFORM_META: Record<AppPlatform, PlatformMeta> = {
  WINDOWS:  { label: "Windows",  emoji: "🪟", color: "blue",   gradient: "linear-gradient(135deg,#4dabf7,#1971c2)" },
  LINUX:    { label: "Linux",    emoji: "🐧", color: "orange", gradient: "linear-gradient(135deg,#ffa94d,#e67700)" },
  MACOS:    { label: "macOS",    emoji: "🍎", color: "gray",   gradient: "linear-gradient(135deg,#ced4da,#495057)" },
  WEB:      { label: "Web",      emoji: "🌐", color: "teal",   gradient: "linear-gradient(135deg,#38d9a9,#0c8599)" },
  ANDROID:  { label: "Android",  emoji: "🤖", color: "green",  gradient: "linear-gradient(135deg,#8ce99a,#2f9e44)" },
  IOS:      { label: "iOS",      emoji: "📱", color: "violet", gradient: "linear-gradient(135deg,#b197fc,#7950f2)" },
};

export const APP_TYPE_LABELS: Record<AppType, string> = {
  WINDOWS_EXE:    ".exe (Windows Installer)",
  WINDOWS_MSI:    ".msi (MSI Package)",
  LINUX_DEB:      ".deb (Debian/Ubuntu)",
  LINUX_RPM:      ".rpm (Fedora/RHEL)",
  LINUX_APPIMAGE: ".AppImage (Portable)",
  LINUX_TARBALL:  ".tar.gz (Archive)",
  MACOS_DMG:      ".dmg (macOS Image)",
  MACOS_APP:      ".app (Application Bundle)",
  WEB_PWA:        "Web App (PWA)",
  ANDROID_APK:    ".apk (Android Package)",
  ANDROID_AAB:    ".aab (App Bundle)",
  IOS_IPA:        ".ipa (iOS Package)",
};

/** Platform uchun qo'llab-quvvatlanadigan AppType lar */
export const PLATFORM_TYPES: Record<AppPlatform, AppType[]> = {
  WINDOWS:  ["WINDOWS_EXE", "WINDOWS_MSI"],
  LINUX:    ["LINUX_DEB", "LINUX_RPM", "LINUX_APPIMAGE", "LINUX_TARBALL"],
  MACOS:    ["MACOS_DMG", "MACOS_APP"],
  WEB:      ["WEB_PWA"],
  ANDROID:  ["ANDROID_APK", "ANDROID_AAB"],
  IOS:      ["IOS_IPA"],
};

/** Relizlarni platformalar bo'yicha guruhlash */
export type GroupedReleases = Partial<Record<AppPlatform, AppReleaseResponse[]>>;

export function groupByPlatform(releases: AppReleaseResponse[]): GroupedReleases {
  return releases.reduce<GroupedReleases>((acc, r) => {
    if (!acc[r.platform]) acc[r.platform] = [];
    acc[r.platform]!.push(r);
    return acc;
  }, {});
}

/** Foydalanuvchi tilida release notes olish */
export function getReleaseNotes(r: AppReleaseResponse, lang: string): string | undefined {
  switch (lang) {
    case "uzc": return r.releaseNotesUzc || r.releaseNotesUzl;
    case "ru":  return r.releaseNotesRu  || r.releaseNotesUzl;
    case "en":  return r.releaseNotesEn  || r.releaseNotesUzl;
    default:    return r.releaseNotesUzl || r.releaseNotesEn;
  }
}
