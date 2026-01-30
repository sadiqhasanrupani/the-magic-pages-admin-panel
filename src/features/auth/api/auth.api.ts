import { apiClient } from '@/lib/api-client';
import type { SignInDto, AuthResponse } from '../types/auth.types';

const BASE_URL = '/admin/auth';

export const login = async (payload: SignInDto): Promise<AuthResponse> => {
  const { data } = await apiClient.post(`${BASE_URL}/login`, payload);
  return data;
};
