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

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Platforma nomi + emoji */
export const PLATFORM_LABELS: Record<AppPlatform, { label: string; emoji: string; color: string }> = {
  WINDOWS:  { label: "Windows",  emoji: "🪟", color: "blue"   },
  LINUX:    { label: "Linux",    emoji: "🐧", color: "orange" },
  MACOS:    { label: "macOS",    emoji: "🍎", color: "gray"   },
  WEB:      { label: "Web",      emoji: "🌐", color: "teal"   },
  ANDROID:  { label: "Android",  emoji: "🤖", color: "green"  },
  IOS:      { label: "iOS",      emoji: "📱", color: "violet" },
};

/** AppType ga mos file extension */
export const APP_TYPE_LABELS: Record<AppType, string> = {
  WINDOWS_EXE:    "Windows .exe (NSIS)",
  WINDOWS_MSI:    "Windows .msi",
  LINUX_DEB:      "Linux .deb (Debian/Ubuntu)",
  LINUX_RPM:      "Linux .rpm (Fedora/RHEL)",
  LINUX_APPIMAGE: "Linux .AppImage",
  LINUX_TARBALL:  "Linux .tar.gz",
  MACOS_DMG:      "macOS .dmg",
  MACOS_APP:      "macOS .app",
  WEB_PWA:        "Web PWA",
  ANDROID_APK:    "Android .apk",
  ANDROID_AAB:    "Android .aab",
  IOS_IPA:        "iOS .ipa",
};

/** Platform uchun mavjud AppType lar */
export const PLATFORM_TYPES: Record<AppPlatform, AppType[]> = {
  WINDOWS:  ["WINDOWS_EXE", "WINDOWS_MSI"],
  LINUX:    ["LINUX_DEB", "LINUX_RPM", "LINUX_APPIMAGE", "LINUX_TARBALL"],
  MACOS:    ["MACOS_DMG", "MACOS_APP"],
  WEB:      ["WEB_PWA"],
  ANDROID:  ["ANDROID_APK", "ANDROID_AAB"],
  IOS:      ["IOS_IPA"],
};

export const STATUS_COLORS: Record<AppReleaseStatus, string> = {
  DRAFT:      "gray",
  ACTIVE:     "green",
  DEPRECATED: "yellow",
  YANKED:     "red",
};

// ─── DTOs ─────────────────────────────────────────────────────────────────────

export interface AppReleaseResponse {
  id:                   number;
  appName:              string;
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
  releaseDate?:         string;   // "YYYY-MM-DD"
  downloadUrl?:         string;
  fileSize?:            number;
  fileSizeFormatted?:   string;   // "12.4 MB"
  checksum?:            string;
  downloadCount:        number;
  createdAt?:           string;
  createdBy?:           string;
  updatedAt?:           string;
}

export interface AppReleaseRequest {
  appName:              string;
  platform:             AppPlatform;
  appType:              AppType;
  version:              string;
  versionCode:          number;
  status?:              AppReleaseStatus;
  isLatest?:            boolean;
  isForceUpdate?:       boolean;
  minSupportedVersion?: string;
  releaseNotesUzl?:     string;
  releaseNotesUzc?:     string;
  releaseNotesRu?:      string;
  releaseNotesEn?:      string;
  releaseDate?:         string;
  downloadUrl?:         string;
  fileSize?:            number;
  checksum?:            string;
}

export interface AppReleaseFilter {
  platform?:  AppPlatform | "";
  appType?:   AppType | "";
  status?:    AppReleaseStatus | "";
  appName?:   string;
  version?:   string;
  page?:      number;
  size?:      number;
  sortBy?:    string;
  sortDir?:   "asc" | "desc";
}

export interface PageResponse<T> {
  content:       T[];
  totalElements: number;
  totalPages:    number;
  number:        number;
  size:          number;
  first:         boolean;
  last:          boolean;
}
