import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { generateToken } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';
import {
  UserBase,
  UserResponse,
  UserCreateRequest,
  UserUpdateRequest,
  UserLoginRequest,
  UserLoginResponse,
  UserDashboardResponse
} from '../../types';

export const userController = {
  // Get all users
  getAllUsers: async (req: Request, res: Response) => {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          // Exclude password for security
        },
      }) as UserResponse[];
      res.json(users);
    } catch (error: unknown) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  },

  // Get current user
  getCurrentUser: async (req: Request, res: Response) => {
    try {
      // The user ID is extracted from the JWT token in the auth middleware
      if (!req.user?.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      
      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: {
          id: true,
          email: true,
          name: true,
          phoneNumber: true,
          weddingDate: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      }) as UserResponse;
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Add additional dashboard data
      // In a real app, you would fetch this from the database
      const dashboardData: UserDashboardResponse = {
        ...user as UserBase,
        giftsCount: 0, // Placeholder - would be calculated from database
        totalAmount: 0, // Placeholder - would be calculated from database
      };
      
      res.json(dashboardData);
    } catch (error: unknown) {
      console.error('Error fetching current user:', error);
      res.status(500).json({ error: 'Failed to fetch user data' });
    }
  },
  
  // Get user by ID
  getUserById: async (req: Request, res: Response) => {
    const { id } = req.params;
    
    try {
      const user = await prisma.user.findUnique({
        where: { id: Number(id) },
        select: {
          id: true,
          email: true,
          name: true,
          weddingDate: true,
        },
      }) as UserResponse;
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json(user);
    } catch (error: unknown) {
      console.error('Error fetching user:', error);
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  },

  // Create new user
  createUser: async (req: Request, res: Response) => {
    const { email, name, password, phoneNumber, weddingDate, role } = req.body as UserCreateRequest;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    try {
      // Hash the password before storing it
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      
      // Parse wedding date if provided
      const parsedWeddingDate = weddingDate ? new Date(weddingDate) : undefined;
      
      // Determine user role
      const userRole = role === 'COUPLE' ? 'COUPLE' : 'GUEST';
      
      const user = await prisma.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
          phoneNumber,
          weddingDate: parsedWeddingDate,
          role: userRole,
        },
        select: {
          id: true,
          email: true,
          name: true,
          phoneNumber: true,
          weddingDate: true,
          role: true,
          createdAt: true,
        },
      });
      
      res.status(201).json(user);
    } catch (error: unknown) {
      console.error('Error creating user:', error);
      
      // Handle unique constraint violation
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
        return res.status(409).json({ error: 'Email already exists' });
      }
      
      res.status(500).json({ error: 'Failed to create user' });
    }
  },

  // Update user
  updateUser: async (req: Request, res: Response) => {
    const { id } = req.params;
    const { email, name, password } = req.body as UserUpdateRequest;
    
    try {
      const updateData: Partial<User> = {};
      
      if (email) updateData.email = email;
      if (name !== undefined) updateData.name = name;
      
      // If password is provided, hash it before updating
      if (password) {
        const saltRounds = 10;
        updateData.password = await bcrypt.hash(password, saltRounds);
      }
      
      const user = await prisma.user.update({
        where: { id: Number(id) },
        data: updateData,
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
        },
      }) as UserResponse;
      
      res.json(user);
    } catch (error: unknown) {
      console.error('Error updating user:', error);
      
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.status(500).json({ error: 'Failed to update user' });
    }
  },

  // Delete user
  deleteUser: async (req: Request, res: Response) => {
    const { id } = req.params;
    
    try {
      await prisma.user.delete({
        where: { id: Number(id) },
      });
      
      res.status(204).send();
    } catch (error: unknown) {
      console.error('Error deleting user:', error);
      
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.status(500).json({ error: 'Failed to delete user' });
    }
  },
  
  // Login user
  loginUser: async (req: Request, res: Response) => {
    const { email, password } = req.body as UserLoginRequest;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    try {
      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email },
      });
      
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      // Compare provided password with stored hash
      const passwordMatch = await bcrypt.compare(password, user.password);
      
      if (!passwordMatch) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      // Generate JWT token
      const token = generateToken(user.id, user.email);
      
      // Return user data without password
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: passwordHash, ...userWithoutPassword } = user;
      
      const response: UserLoginResponse = {
        ...userWithoutPassword as UserBase,
        token,
        message: 'Login successful'
      };
      
      res.json(response);
    } catch (error: unknown) {
      console.error('Error during login:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  },
};

export default userController;
