import { apiClient } from '@/lib/api-client';
import type {
  Category,
  CreateCategoryPayload,
  UpdateCategoryPayload,
  FindAllResponse,
  AgeCategoryParams
} from '../types/categories.types';

const BASE_URL = '/categories';

export const getCategories = async (params?: AgeCategoryParams): Promise<FindAllResponse> => {
  const { data } = await apiClient.get(BASE_URL, { params });
  return data;
};

export const getCategory = async (id: string): Promise<Category> => {
  const { data } = await apiClient.get(`${BASE_URL}/${id}`);
  return data;
};

export const createCategory = async (payload: CreateCategoryPayload): Promise<Category> => {
  const { data } = await apiClient.post(BASE_URL, payload);
  return data;
};

export const updateCategory = async (id: string, payload: UpdateCategoryPayload): Promise<Category> => {
  const { data } = await apiClient.put(`${BASE_URL}/${id}`, payload);
  return data;
};

export const deleteCategory = async (id: string): Promise<void> => {
  await apiClient.delete(`${BASE_URL}/${id}`);
};

export const uploadFile = async (file: File): Promise<{ url: string }> => {
  const formData = new FormData();
  formData.append('file', file);

  const { data } = await apiClient.post('/admin/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return data;
};
