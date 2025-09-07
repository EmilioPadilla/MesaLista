import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { createSessionAndSetCookie, logoutSession } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';
import {
  UserBase,
  UserCreateRequest,
  UserDashboardResponse,
  UserLoginRequest,
  UserLoginResponse,
  UserResponse,
  UserUpdateRequest,
} from '../../types/api/user.js';
import { UserRole } from '../../types/models/user.js';
import { User } from 'types/models/user.js';

/**
 * Generates a slug from first names and checks for uniqueness
 * If the slug already exists, it will try with last names
 * @param firstName First name of the user
 * @param spouseFirstName First name of the spouse
 * @param lastName Last name of the user (used if first name slug exists)
 * @param spouseLastName Last name of the spouse (used if first name slug exists)
 * @returns A unique slug for the couple
 */
async function generateCoupleSlug(
  firstName: string,
  spouseFirstName: string,
  lastName: string,
  spouseLastName: string
): Promise<string> {
  // Helper function to normalize text for slugs
  const normalizeForSlug = (text: string): string => {
    return text
      .toLowerCase()
      .normalize('NFD') // Normalize to decomposed form
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  };

  // Generate the initial slug from first names
  const firstNameSlug = `${normalizeForSlug(firstName)}-y-${normalizeForSlug(spouseFirstName)}`;
  
  // Check if this slug already exists
  const existingWithFirstNameSlug = await prisma.user.findUnique({
    where: { coupleSlug: firstNameSlug },
  });

  if (!existingWithFirstNameSlug) {
    return firstNameSlug;
  }

  // If first name slug exists, try with first names and last names
  const fullNameSlug = `${normalizeForSlug(firstName)}-${normalizeForSlug(lastName)}-y-${normalizeForSlug(spouseFirstName)}-${normalizeForSlug(spouseLastName)}`;
  
  // Check if this slug already exists
  const existingWithFullNameSlug = await prisma.user.findUnique({
    where: { coupleSlug: fullNameSlug },
  });

  if (!existingWithFullNameSlug) {
    return fullNameSlug;
  }

  // If both slugs exist, add a random number to ensure uniqueness
  const randomSuffix = Math.floor(Math.random() * 1000);
  return `${firstNameSlug}-${randomSuffix}`;
}

export const userController = {
  // Get all users
  getAllUsers: async (req: Request, res: Response) => {
    try {
      const users = (await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          spouseFirstName: true,
          spouseLastName: true,
          imageUrl: true,
          phoneNumber: true,
          role: true,
          createdAt: true,
          // Exclude password for security
        },
      })) as UserBase[];
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

      const user = (await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          spouseFirstName: true,
          coupleSlug: true,
          spouseLastName: true,
          imageUrl: true,
          phoneNumber: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      })) as UserResponse;

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Add additional dashboard data
      // In a real app, you would fetch this from the database
      const dashboardData: UserDashboardResponse = {
        ...(user as UserBase),
        giftsCount: 0, // Placeholder - would be calculated from database
        totalAmount: 0, // Placeholder - would be calculated from database
      };

      res.json(dashboardData);
    } catch (error: unknown) {
      console.error('Error fetching current user:', error);
      res.status(500).json({ error: 'Failed to fetch user data' });
    }
  },

  // Get user by couple slug
  getUserBySlug: async (req: Request, res: Response) => {
    const { coupleSlug } = req.params;

    try {
      const user = (await prisma.user.findUnique({
        where: { coupleSlug },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          spouseFirstName: true,
          spouseLastName: true,
          coupleSlug: true,
          imageUrl: true,
          phoneNumber: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      })) as UserResponse;

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(user);
    } catch (error: unknown) {
      console.error('Error fetching user by slug:', error);
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  },

  // Get user by ID
  getUserById: async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
      const user = (await prisma.user.findUnique({
        where: { id: Number(id) },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          spouseFirstName: true,
          spouseLastName: true,
          imageUrl: true,
          phoneNumber: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      })) as UserResponse;

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
    const { email, firstName, lastName, spouseFirstName, spouseLastName, password, phoneNumber, role } = req.body as UserCreateRequest;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
      // Hash the password before storing it
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Determine user role (now supporting ADMIN role as well)
      let userRole: UserRole = 'GUEST';
      if (role === 'COUPLE') {
        userRole = 'COUPLE';
      } else if (role === 'ADMIN') {
        userRole = 'ADMIN';
      }
      
      // Generate a unique couple slug if this is a COUPLE user
      let coupleSlug: string | undefined;
      if (userRole === 'COUPLE' && firstName && spouseFirstName) {
        coupleSlug = await generateCoupleSlug(
          firstName,
          spouseFirstName || firstName, // Fallback to firstName if spouseFirstName is not provided
          lastName,
          spouseLastName || lastName // Fallback to lastName if spouseLastName is not provided
        );
      }

      // Use a transaction to ensure both user and wedding list (if applicable) are created together
      const result = await prisma.$transaction(async (prisma) => {
        // Create the user
        const user = await prisma.user.create({
          data: {
            email,
            firstName,
            lastName,
            spouseFirstName,
            spouseLastName,
            password: hashedPassword,
            phoneNumber,
            role: userRole,
            coupleSlug, // Add the generated coupleSlug
          },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            spouseFirstName: true,
            spouseLastName: true,
            coupleSlug: true, // Include coupleSlug in the response
            imageUrl: true,
            phoneNumber: true,
            role: true,
            createdAt: true,
          },
        });

        // If the user is a COUPLE, automatically create a wedding list
        if (userRole === 'COUPLE') {
          // Calculate a default wedding date (1 year from now)
          const weddingDate = new Date();
          weddingDate.setFullYear(weddingDate.getFullYear() + 1);
          
          // Create a wedding list for the couple
          const weddingList = await prisma.weddingList.create({
            data: {
              coupleId: user.id,
              title: `Lista de ${firstName} y ${spouseFirstName || ''}`.trim(),
              coupleName: `${firstName} y ${spouseFirstName || ''}`.trim(),
              weddingDate,
              description: 'Nuestra lista de regalos',
            },
          });
          
          // Return both user and wedding list
          return { user, weddingList };
        }
        
        // If not a COUPLE, just return the user
        return { user };
      });

      res.status(201).json(result.user);
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
    const { email, firstName, lastName, spouseFirstName, spouseLastName } = req.body as UserUpdateRequest;

    try {
      const updateData: Partial<UserBase> = {};

      if (email) updateData.email = email;
      if (firstName !== undefined) updateData.firstName = firstName;
      if (lastName !== undefined) updateData.lastName = lastName;
      if (spouseFirstName !== undefined) updateData.spouseFirstName = spouseFirstName;
      if (spouseLastName !== undefined) updateData.spouseLastName = spouseLastName;

      const user = (await prisma.user.update({
        where: { id: Number(id) },
        data: updateData,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          spouseFirstName: true,
          spouseLastName: true,
          imageUrl: true,
          phoneNumber: true,
          role: true,
          createdAt: true,
        },
      })) as UserResponse;

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

      // Create session and set HttpOnly cookie
      const userAgent = req.get('User-Agent') || 'Unknown';
      const ipAddress = req.ip || req.connection.remoteAddress;

      const session = await createSessionAndSetCookie(res, user.id, userAgent, ipAddress);

      // Return user data without password or token (token is now in HttpOnly cookie)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: passwordHash, ...userWithoutPassword } = user;

      const response: UserLoginResponse = {
        ...(userWithoutPassword as UserBase),
        token: '', // No longer needed since we use HttpOnly cookies
        message: 'Login successful',
      };

      res.json(response);
    } catch (error: unknown) {
      console.error('Error during login:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  },

  // Logout user
  logoutUser: async (req: Request, res: Response) => {
    try {
      await logoutSession(req, res);
      res.json({ message: 'Logout successful' });
    } catch (error: unknown) {
      console.error('Error during logout:', error);
      res.status(500).json({ error: 'Logout failed' });
    }
  },

  // Update user password
  updateUserPassword: async (req: Request, res: Response) => {
    const { id } = req.params;
    const { password } = req.body as UserUpdateRequest;

    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    try {
      const user = (await prisma.user.update({
        where: { id: Number(id) },
        data: { password: hashedPassword },
      })) as UserResponse;

      res.json(user);
    } catch (error: unknown) {
      console.error('Error updating user password:', error);

      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
        return res.status(404).json({ error: 'User not found' });
      }

      res.status(500).json({ error: 'Failed to update user password' });
    }
  },
};

export default userController;
