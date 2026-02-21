export interface User {
  id: number;
  fullName: string;
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
  email: string | null;
  role: "SUPER_ADMIN" | "ADMIN" | "USER";
  isActive: boolean;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  preferredLanguage: string;
  lastLoginAt: string | null;
  profileImageUrl: string | null;
  oauthProvider: "LOCAL" | "GOOGLE" | "TELEGRAM";
  telegramUsername: string | null;
  maxDevices: number;
  activeDeviceCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface UsersResponse {
  success: boolean;
  data: {
    content: User[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
}

export interface CreateUserDTO {
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  email?: string;
  password: string;
  role: "ADMIN" | "USER";
  preferredLanguage?: string;
}

export interface UpdateUserDTO {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  email?: string;
  preferredLanguage?: string;
}

export interface ChangeRoleDTO {
  role: "SUPER_ADMIN" | "ADMIN" | "USER";
}

export interface ChangeStatusDTO {
  active: boolean;
}
