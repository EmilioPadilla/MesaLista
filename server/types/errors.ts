/**
 * Custom error types for the application
 */

export interface PrismaError extends Error {
  code?: string;
  meta?: {
    target?: string[];
    [key: string]: unknown;
  };
}

export class AppError extends Error {
  statusCode: number;
  
  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
  }
}
