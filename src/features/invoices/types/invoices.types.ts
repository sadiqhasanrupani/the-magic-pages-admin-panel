// Mirror of backend entities — kept in sync with libs/contract/src/invoices/

export type InvoiceStatus =
  | 'DRAFT'
  | 'ISSUED'
  | 'PAID'
  | 'OVERDUE'
  | 'CANCELLED'
  | 'REFUNDED';

export type InvoiceItemType = 'TANGIBLE' | 'INTANGIBLE';

/**
 * Wire values for a book format. These are LOWERCASE because that is what the
 * backend's `BookFormat` enum stores and what `CreateInvoiceItemDto` validates
 * with `IsEnum` -- an uppercase value is rejected with a 400.
 */
export type BookFormat =
  | 'hardcover'
  | 'paperback'
  | 'physical'
  | 'ebook'
  | 'pdf'
  | 'epub'
  | 'audiobook'
  | 'docx'
  | 'worksheet';

// ── Address snapshots ──────────────────────────────────────────────────────

export interface ShippingAddress {
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
}

export interface BillingAddress {
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  email?: string;
}

// ── Invoice item ───────────────────────────────────────────────────────────

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  itemType: InvoiceItemType;
  title: string;
  format: BookFormat;
  sku: string | null;
  fileDeliveryUrl: string | null;
  requiresShipping: boolean;
  quantity: number;
  // Backend returns numeric columns as strings to preserve precision
  unitPrice: string;
  totalPrice: string;
  taxRate: string;
  taxAmount: string;
  discountAmount: string;
  orderItemId: number | null;
  bookFormatVariantId: number | null;
  createdAt: string;
  updatedAt: string;
}

// ── Invoice ────────────────────────────────────────────────────────────────

export interface Invoice {
  id: string;
  invoiceNumber: string;
  orderId: number;
  userId: number;
  user: {
    id: number;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
  order: {
    id: number;
    total_amount: string;
    payment_status: string;
  };
  status: InvoiceStatus;
  invoiceDate: string;
  dueDate: string | null;
  issuedAt: string | null;
  paidAt: string | null;
  currency: string;
  subtotal: string;
  taxRate: string;
  taxAmount: string;
  discountAmount: string;
  totalAmount: string;
  hasPhysicalItems: boolean;
  hasDigitalItems: boolean;
  shippingAddress: ShippingAddress | null;
  billingAddress: BillingAddress | null;
  gatewayTransactionRef: string | null;
  notes: string | null;
  items: InvoiceItem[];
  createdAt: string;
  updatedAt: string;
}

// ── API response shapes ────────────────────────────────────────────────────

export interface PaginationMeta {
  itemsPerPage: number;
  totalItems: number;
  currentPage: number;
  totalPages: number;
}

export interface FindAllInvoicesResponse {
  message: string;
  data: Invoice[];
  meta: PaginationMeta;
}

export interface SingleInvoiceResponse {
  message: string;
  data: Invoice;
}

// ── Request payloads (match CreateInvoiceDto exactly) ─────────────────────

export interface CreateInvoiceItemPayload {
  orderItemId?: number;
  bookFormatVariantId?: number;
  itemType: InvoiceItemType;
  title: string;
  format: BookFormat;
  sku?: string;
  fileDeliveryUrl?: string;
  quantity: number;
  unitPrice: number;
  taxRate?: number;
  discountAmount?: number;
}

export interface CreateInvoicePayload {
  orderId: number;
  items: CreateInvoiceItemPayload[];
  invoiceDate: string;
  dueDate?: string;
  currency?: string;
  taxRate?: number;
  discountAmount?: number;
  shippingAddress?: ShippingAddress;
  billingAddress?: BillingAddress;
  gatewayTransactionRef?: string;
  notes?: string;
}

// ── Query params ───────────────────────────────────────────────────────────

export interface InvoiceQueryParams {
  page?: number;
  limit?: number;
  status?: InvoiceStatus;
  sortBy?: 'createdAt' | 'invoiceDate' | 'totalAmount';
  sortOrder?: 'ASC' | 'DESC';
  userId?: number;
  orderId?: number;
}
