import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { createInvoice, getInvoice, getInvoices } from '../api/invoices.api';
import type { CreateInvoicePayload, InvoiceQueryParams } from '../types/invoices.types';
import { handleUnauthorized } from '@/features/auth/utils/auth-handler';

// ── Query Key Factory ──────────────────────────────────────────────────────

export const invoiceKeys = {
  all: ['invoices'] as const,
  lists: () => [...invoiceKeys.all, 'list'] as const,
  list: (params: InvoiceQueryParams) => [...invoiceKeys.lists(), params] as const,
  details: () => [...invoiceKeys.all, 'detail'] as const,
  detail: (id: string) => [...invoiceKeys.details(), id] as const,
};

// ── Shared error handlers ──────────────────────────────────────────────────

const handleQueryError = (error: unknown) => {
  const err = error as { response?: { status?: number } };
  if (err.response?.status === 401) handleUnauthorized();
  throw error;
};

const handleMutationError = (error: unknown) => {
  const err = error as { response?: { status?: number; data?: { message?: string | string[] } } };
  if (err.response?.status === 401) {
    handleUnauthorized();
    return;
  }
  const raw = err.response?.data?.message ?? 'An unexpected error occurred.';
  toast.error(Array.isArray(raw) ? raw.join(' · ') : raw);
};

// ── useInvoices — paginated list ───────────────────────────────────────────

export const useInvoices = (params: InvoiceQueryParams = {}) => {
  return useQuery({
    queryKey: invoiceKeys.list(params),
    queryFn: async () => {
      try {
        return await getInvoices(params);
      } catch (error) {
        handleQueryError(error);
        throw error;
      }
    },
    // Keep showing previous page data while next page is loading
    placeholderData: (previousData) => previousData,
    retry: (failureCount, error: unknown) => {
      const err = error as { response?: { status?: number } };
      if (err.response?.status === 401) return false;
      return failureCount < 3;
    },
  });
};

// ── useInvoice — single detail ─────────────────────────────────────────────

export const useInvoice = (id: string) => {
  return useQuery({
    queryKey: invoiceKeys.detail(id),
    queryFn: async () => {
      try {
        return await getInvoice(id);
      } catch (error) {
        handleQueryError(error);
        throw error;
      }
    },
    enabled: !!id,
  });
};

// ── useCreateInvoice — POST mutation ──────────────────────────────────────

export const useCreateInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateInvoicePayload) => createInvoice(payload),
    onSuccess: (response) => {
      toast.success(`Invoice ${response.data.invoiceNumber} created successfully.`);
      // Invalidate all invoice lists so the new entry appears immediately
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
    },
    onError: handleMutationError,
  });
};
