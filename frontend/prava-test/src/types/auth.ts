export interface User {
  id: number;
  fullName: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  email?: string;
  preferredLanguage?: string;
  /** Role as returned by the backend: "SUPER_ADMIN" | "ADMIN" | "USER" */
  role?: string;
  hasSubscription?: boolean;
  packageActive?: boolean;
  subscriptionPlan?: string;
  subscriptionExpiresAt?: string;
  /** Profil rasmi: yuklangan (/api/v1/files/profiles/…), tayyor avatar (/api/v1/public/avatars/…) yoki Google/Telegram. */
  profileImageUrl?: string | null;
}

export interface AuthData {
  accessToken: string;
  refreshToken?: string;
  user: User;
  expiresIn?: number;
  rememberMe?: boolean;
}

export interface UserResponse {
  id: number;
  fullName: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  email?: string;
  preferredLanguage?: string;
  role?: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  createdAt?: string;
  lastLoginAt?: string;
  profileImageUrl?: string | null;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
