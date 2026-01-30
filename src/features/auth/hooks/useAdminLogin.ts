'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Cookies from 'js-cookie';
import { login } from '../api/auth.api';
import type { SignInDto } from '../types/auth.types';

export const useAdminLogin = () => {
  const router = useRouter();

  return useMutation({
    mutationFn: (payload: SignInDto) => login(payload),
    onSuccess: (data) => {
      // Store token in cookie (expires in 1 day)
      Cookies.set('accessToken', data.accessToken, { expires: 1 });

      // Store user details for UI
      localStorage.setItem('user', JSON.stringify({
        email: data.email,
        role: data.role,
        userId: data.userId
      }));

      toast.success('Login successful');
      router.push('/admin/books');
    },
    onError: (error: any) => {
      const status = error.response?.status;

      if (status === 401) {
        toast.error('Invalid email or password');
      } else if (status === 403) {
        toast.error('Access Denied: You do not have administrator privileges.');
      } else {
        toast.error('Something went wrong. Please try again.');
      }
    },
  });
};
