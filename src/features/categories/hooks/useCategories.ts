import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  uploadFile
} from '../api/categories.api';
import type {
  AgeCategoryParams,
  CreateCategoryPayload,
  UpdateCategoryPayload
} from '../types/categories.types';

export const bookKeys = {
  all: ['categories'] as const,
  lists: () => [...bookKeys.all, 'list'] as const,
  list: (params: AgeCategoryParams) => [...bookKeys.lists(), params] as const,
  details: () => [...bookKeys.all, 'detail'] as const,
  detail: (id: string) => [...bookKeys.details(), id] as const,
};

export const useCategoriesQuery = (params: AgeCategoryParams = {}) => {
  return useQuery({
    queryKey: bookKeys.list(params),
    queryFn: () => getCategories(params),
    placeholderData: (previousData) => previousData, // Keep previous data while fetching new page
  });
};

export const useCategoryQuery = (id: string) => {
  return useQuery({
    queryKey: bookKeys.detail(id),
    queryFn: () => getCategory(id),
    enabled: !!id,
  });
};

export const useCategoryMutation = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (payload: CreateCategoryPayload) => createCategory(payload),
    onSuccess: () => {
      toast.success('Book created successfully');
      queryClient.invalidateQueries({ queryKey: bookKeys.lists() });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create book');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateCategoryPayload }) =>
      updateCategory(id, payload),
    onSuccess: (data) => {
      toast.success('Book updated successfully');
      queryClient.invalidateQueries({ queryKey: bookKeys.lists() });
      queryClient.invalidateQueries({ queryKey: bookKeys.detail(data.id) });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update book');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => {
      toast.success('Book deleted successfully');
      queryClient.invalidateQueries({ queryKey: bookKeys.lists() });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete book');
    },
  });

  return {
    createMutation,
    updateMutation,
    deleteMutation,
    uploadFile
  };
};
