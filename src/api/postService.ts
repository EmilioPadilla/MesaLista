import apiClient from './client';
import type { User } from './userService';

export interface Post {
  id: number;
  title: string;
  content: string | null;
  published: boolean;
  createdAt: string;
  updatedAt: string;
  authorId: number;
  author?: User;
}

export const postService = {
  getAll: async (): Promise<Post[]> => {
    const response = await apiClient.get('/posts');
    return response.data;
  },
  
  getById: async (id: number): Promise<Post> => {
    const response = await apiClient.get(`/posts/${id}`);
    return response.data;
  },
  
  create: async (postData: Omit<Post, 'id' | 'createdAt' | 'updatedAt' | 'author'>): Promise<Post> => {
    const response = await apiClient.post('/posts', postData);
    return response.data;
  },
  
  update: async (id: number, postData: Partial<Omit<Post, 'id' | 'createdAt' | 'updatedAt' | 'author'>>): Promise<Post> => {
    const response = await apiClient.put(`/posts/${id}`, postData);
    return response.data;
  },
  
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/posts/${id}`);
  },
  
  publish: async (id: number): Promise<Post> => {
    const response = await apiClient.patch(`/posts/${id}/publish`);
    return response.data;
  },
  
  unpublish: async (id: number): Promise<Post> => {
    const response = await apiClient.patch(`/posts/${id}/unpublish`);
    return response.data;
  }
};

export default postService;
