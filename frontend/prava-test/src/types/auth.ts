export interface User {
  id: number;
  fullName: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  email?: string;
  preferredLanguage?: string;
}

export interface AuthData {
  accessToken: string;
  refreshToken?: string;
  user: User;
  expiresIn?: number;
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
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
