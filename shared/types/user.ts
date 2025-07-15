import { User, UserRole } from '@prisma/client';

// Base types from Prisma models
export interface UserBase extends Omit<User, 'password'> {
  id: number;
  name: string;
  email: string;
  phoneNumber: string | null;
  weddingDate: Date | null;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

// User-related interfaces
export interface UserCreateRequest {
  email: string;
  name: string;
  password: string;
  phoneNumber?: string;
  weddingDate?: string;
  role?: UserRole;
}

export interface UserUpdateRequest {
  email?: string;
  name?: string;
  password?: string;
  phoneNumber?: string;
  weddingDate?: string;
  role?: UserRole;
}

export interface UserLoginRequest {
  email: string;
  password: string;
}

export interface UserLoginResponse extends UserBase {
  token: string;
  message: string;
}

export interface UserDashboardResponse extends UserBase {
  giftsCount: number;
  totalAmount: number;
}

// User response type (simplified for relations)
export interface UserResponse {
  id: number;
  name: string;
  email: string;
  phoneNumber?: string;
  weddingDate?: Date | string;
  role?: UserRole;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}
