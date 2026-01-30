import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getAgeGroups,
  getAgeGroup,
  createAgeGroup,
  updateAgeGroup,
  deleteAgeGroup,
  uploadFile
} from '../api/age-groups.api';
import type {
  AgeGroupQueryParams,
  CreateAgeGroupPayload,
  UpdateAgeGroupPayload
} from '../types/age-groups.types';

export const bookKeys = {
  all: ['age-groups'] as const,
  lists: () => [...bookKeys.all, 'list'] as const,
  list: (params: AgeGroupQueryParams) => [...bookKeys.lists(), params] as const,
  details: () => [...bookKeys.all, 'detail'] as const,
  detail: (id: string) => [...bookKeys.details(), id] as const,
};

export const useAgeGroupsQuery = (params: AgeGroupQueryParams = {}) => {
  return useQuery({
    queryKey: bookKeys.list(params),
    queryFn: () => getAgeGroups(params),
    placeholderData: (previousData) => previousData, // Keep previous data while fetching new page
  });
};

export const useBookQuery = (id: string) => {
  return useQuery({
    queryKey: bookKeys.detail(id),
    queryFn: () => getAgeGroup(id),
    enabled: !!id,
  });
};

export const useBookMutation = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (payload: CreateAgeGroupPayload) => createAgeGroup(payload),
    onSuccess: () => {
      toast.success('Book created successfully');
      queryClient.invalidateQueries({ queryKey: bookKeys.lists() });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create book');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateAgeGroupPayload }) =>
      updateAgeGroup(id, payload),
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
    mutationFn: (id: string) => deleteAgeGroup(id),
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
