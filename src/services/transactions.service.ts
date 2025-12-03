import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export interface Transaction {
  id: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
  provider: 'PHONEPE' | 'RAZORPAY';
  created_at: string;
  gateway_ref_id?: string;
  order: {
    id: number;
    user: {
      email: string;
      firstName?: string;
      lastName?: string;
    };
  };
}

export interface TransactionsResponse {
  data: Transaction[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const TransactionsService = {
  async getTransactions(page = 1, limit = 10, status?: string): Promise<TransactionsResponse> {
    const params = { page, limit, status };
    const response = await axios.get(`${API_URL}/transactions`, { params });
    return response.data;
  },

  async refundTransaction(id: string, amount?: number, reason?: string) {
    const response = await axios.post(`${API_URL}/transactions/${id}/refund`, { amount, reason });
    return response.data;
  },
};
