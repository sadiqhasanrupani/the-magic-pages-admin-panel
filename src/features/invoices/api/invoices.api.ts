import { apiClient } from '@/lib/api-client';
import type {
  FindAllInvoicesResponse,
  SingleInvoiceResponse,
  CreateInvoicePayload,
  InvoiceQueryParams,
} from '../types/invoices.types';

const BASE_URL = '/invoices';

export const getInvoices = async (
  params?: InvoiceQueryParams,
): Promise<FindAllInvoicesResponse> => {
  const { data } = await apiClient.get(BASE_URL, { params });
  return data;
};

export const getInvoice = async (id: string): Promise<SingleInvoiceResponse> => {
  const { data } = await apiClient.get(`${BASE_URL}/${id}`);
  return data;
};

export const createInvoice = async (
  payload: CreateInvoicePayload,
): Promise<SingleInvoiceResponse> => {
  const { data } = await apiClient.post(BASE_URL, payload);
  return data;
};
