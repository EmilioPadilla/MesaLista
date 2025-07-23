import { UserRole } from '../models/user.js';

export interface UserBase {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  spouseFirstName: string;
  spouseLastName: string;
  imageUrl?: string;
  phoneNumber?: string;
  role: UserRole;
  createdAt: Date;
}

export interface UserResponse extends UserBase {
  updatedAt?: Date;
}

export interface UserCreateRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  spouseFirstName: string;
  spouseLastName: string;
  phoneNumber?: string;
  role?: UserRole;
}

export interface UserUpdateRequest {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  spouseFirstName?: string;
  spouseLastName?: string;
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
