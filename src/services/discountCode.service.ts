import client from './client';
import { endpoints } from './endpoints';

export interface DiscountCode {
  id: number;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  usageLimit: number;
  usageCount: number;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    users: number;
  };
}

export interface DiscountCodeWithUsers extends DiscountCode {
  users: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    createdAt: string;
  }[];
}

export interface ValidateDiscountCodeResponse {
  id: number;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
}

export interface CreateDiscountCodeRequest {
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  usageLimit: number;
  expiresAt?: string;
}

export interface UpdateDiscountCodeRequest {
  code?: string;
  discountType?: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue?: number;
  usageLimit?: number;
  isActive?: boolean;
  expiresAt?: string;
}

const discountCodeService = {
  // Public: Validate a discount code
  async validateDiscountCode(code: string): Promise<ValidateDiscountCodeResponse> {
    const response = await client.get(endpoints.discountCodes.validate(code));
    return response.data;
  },

  // Admin: Get all discount codes
  async getAllDiscountCodes(): Promise<DiscountCode[]> {
    const response = await client.get(endpoints.discountCodes.getAllAdmin);
    return response.data;
  },

  // Admin: Get discount code statistics
  async getDiscountCodeStats(id: number): Promise<DiscountCodeWithUsers> {
    const response = await client.get(endpoints.discountCodes.getStatsAdmin(id));
    return response.data;
  },

  // Admin: Create a new discount code
  async createDiscountCode(data: CreateDiscountCodeRequest): Promise<DiscountCode> {
    const response = await client.post(endpoints.discountCodes.createAdmin, data);
    return response.data;
  },

  // Admin: Update a discount code
  async updateDiscountCode(id: number, data: UpdateDiscountCodeRequest): Promise<DiscountCode> {
    const response = await client.put(endpoints.discountCodes.updateAdmin(id), data);
    return response.data;
  },

  // Admin: Delete a discount code
  async deleteDiscountCode(id: number): Promise<void> {
    await client.delete(endpoints.discountCodes.deleteAdmin(id));
  },
};

export default discountCodeService;
