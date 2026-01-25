import { useQuery, useMutation, useQueryClient, UseMutationOptions } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getBooks,
  getBook,
  createBook,
  updateBook,
  deleteBook,
  uploadFile,
} from '../api/books.api';
import type {
  BookQueryParams,
  CreateBookPayload,
  UpdateBookPayload,
  Book
} from '../types/books.types';
import { handleUnauthorized } from '@/features/auth/utils/auth-handler';

/**
 * @principle High-level Query Key Factory for cache consistency
 */
export const bookKeys = {
  all: ['books'] as const,
  lists: () => [...bookKeys.all, 'list'] as const,
  list: (params: BookQueryParams) => [...bookKeys.lists(), params] as const,
  details: () => [...bookKeys.all, 'detail'] as const,
  detail: (id: string) => [...bookKeys.details(), id] as const,
};

// Generic Error Handler to avoid repetition
const handleMutationError = (error: any) => {
  if (error.response?.status === 401) {
    handleUnauthorized();
    return;
  }
  const message = error.response?.data?.message || 'An unexpected error occurred';
  toast.error(message);
};

export const useBooksQuery = (params: BookQueryParams = {}) => {
  return useQuery({
    queryKey: bookKeys.list(params),
    queryFn: async () => {
      try {
        return await getBooks(params);
      } catch (error: any) {
        if (error.response?.status === 401) handleUnauthorized();
        throw error;
      }
    },
    placeholderData: (previousData) => previousData,
    retry: (failureCount, error: any) => {
      // Don't retry if it's an auth error
      if (error.response?.status === 401) return false;
      return failureCount < 3;
    }
  });
};

export const useBookQuery = (id: string) => {
  return useQuery({
    queryKey: bookKeys.detail(id),
    queryFn: async () => {
      try {
        return await getBook(id);
      } catch (error: any) {
        if (error.response?.status === 401) handleUnauthorized();
        throw error;
      }
    },
    enabled: !!id,
  });
};

/**
 * @principle Optimized Mutations with Atomic Invalidation
 */
export const useBookMutation = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: createBook,
    onSuccess: () => {
      toast.success('Book created successfully');
      queryClient.invalidateQueries({ queryKey: bookKeys.lists() });
    },
    onError: handleMutationError,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateBookPayload }) =>
      updateBook(id, payload),
    onSuccess: (data) => {
      toast.success('Book updated successfully');
      // Refetch lists and specific detail for consistency
      queryClient.invalidateQueries({ queryKey: bookKeys.lists() });
      queryClient.setQueryData(bookKeys.detail(data.id), data);
    },
    onError: handleMutationError,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBook,
    onSuccess: () => {
      toast.success('Book deleted successfully');
      queryClient.invalidateQueries({ queryKey: bookKeys.lists() });
    },
    onError: handleMutationError,
  });

  return {
    createMutation,
    updateMutation,
    deleteMutation,
    uploadFile,
  };
};
