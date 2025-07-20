import type { User, UserRole } from '@prisma/client';

// Base types from Prisma models
export interface UserBase extends Omit<User, 'password'> {
  id: number;
  firstName: string;
  lastName: string;
  spouseFirstName: string | null;
  spouseLastName: string | null;
  imageUrl: string | null;
  email: string;
  phoneNumber: string | null;
  weddingLocation: string | null;
  weddingDate: Date | null;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

// User-related interfaces
export interface UserCreateRequest {
  email: string;
  spouseFirstName?: string;
  spouseLastName?: string;
  imageUrl?: string;
  firstName: string;
  lastName: string;
  password: string;
  phoneNumber?: string;
  weddingLocation?: string;
  weddingDate?: string;
  role?: UserRole;
}

export interface UserUpdateRequest {
  email?: string;
  spouseFirstName?: string;
  spouseLastName?: string;
  imageUrl?: string;
  firstName?: string;
  lastName?: string;
  password?: string;
  phoneNumber?: string;
  weddingLocation?: string;
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
  firstName: string | null;
  lastName: string | null;
  spouseFirstName: string | null;
  spouseLastName: string | null;
  imageUrl: string | null;
  email: string;
  phoneNumber?: string | null;
  weddingLocation?: string;
  weddingDate?: Date | string;
  role?: UserRole;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}
