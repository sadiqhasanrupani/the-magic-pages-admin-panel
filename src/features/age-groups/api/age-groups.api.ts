import { apiClient } from '@/lib/api-client';
import type {
  AgeGroup,
  CreateAgeGroupPayload,
  UpdateAgeGroupPayload,
  FindAllResponse,
  AgeGroupQueryParams
} from '../types/age-groups.types';

const BASE_URL = '/age-groups';

export const getAgeGroups = async (params?: AgeGroupQueryParams): Promise<FindAllResponse> => {
  const { data } = await apiClient.get(BASE_URL, { params });
  return data;
};

export const getAgeGroup = async (id: string): Promise<AgeGroup> => {
  const { data } = await apiClient.get(`${BASE_URL}/${id}`);
  return data;
};

export const createAgeGroup = async (payload: CreateAgeGroupPayload): Promise<AgeGroup> => {
  const { data } = await apiClient.post(BASE_URL, payload);
  return data;
};

export const updateAgeGroup = async (id: string, payload: UpdateAgeGroupPayload): Promise<AgeGroup> => {
  const { data } = await apiClient.put(`${BASE_URL}/${id}`, payload);
  return data;
};

export const deleteAgeGroup = async (id: string): Promise<void> => {
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
