import { apiClient } from '@/lib/api-client';
import type {
  Book,
  CreateBookPayload,
  UpdateBookPayload,
  FindAllResponse,
  BookQueryParams
} from '../types/books.types';

const BASE_URL = '/admin/books';

export const getBooks = async (params?: BookQueryParams): Promise<FindAllResponse> => {
  const { data } = await apiClient.get(BASE_URL, { params });
  return data;
};

export const getBook = async (id: string): Promise<Book> => {
  const { data } = await apiClient.get(`${BASE_URL}/${id}`);
  return data;
};

export const createBook = async (payload: CreateBookPayload): Promise<Book> => {
  const { data } = await apiClient.post(BASE_URL, payload);
  return data;
};

export const updateBook = async (id: string, payload: UpdateBookPayload): Promise<Book> => {
  const { data } = await apiClient.put(`${BASE_URL}/${id}`, payload);
  return data;
};

export const deleteBook = async (id: string): Promise<void> => {
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
