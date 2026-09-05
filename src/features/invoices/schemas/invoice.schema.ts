import * as z from 'zod';

// ── Shared sub-schemas ─────────────────────────────────────────────────────

export const InvoiceItemTypeEnum = z.enum(['TANGIBLE', 'INTANGIBLE']);
export const InvoiceStatusEnum   = z.enum(['DRAFT', 'ISSUED', 'PAID', 'OVERDUE', 'CANCELLED', 'REFUNDED']);

export const BookFormatEnum = z.enum([
  'hardcover',
  'paperback',
  'physical',
  'ebook',
  'pdf',
  'epub',
  'audiobook',
  'docx',
  'worksheet',
]);

export const shippingAddressSchema = z.object({
  fullName:     z.string().min(1, 'Full name is required').max(120),
  addressLine1: z.string().min(1, 'Address line 1 is required').max(255),
  addressLine2: z.string().max(255).optional(),
  city:         z.string().min(1, 'City is required').max(100),
  state:        z.string().min(1, 'State is required').max(100),
  postalCode:   z.string().min(1, 'Postal code is required').max(20),
  country:      z.string().min(1, 'Country is required').max(100),
  phone:        z.string().max(20).optional(),
});

export const billingAddressSchema = z.object({
  fullName:     z.string().min(1, 'Full name is required').max(120),
  addressLine1: z.string().min(1, 'Address line 1 is required').max(255),
  addressLine2: z.string().max(255).optional(),
  city:         z.string().min(1, 'City is required').max(100),
  state:        z.string().min(1, 'State is required').max(100),
  postalCode:   z.string().min(1, 'Postal code is required').max(20),
  country:      z.string().min(1, 'Country is required').max(100),
  email:        z.string().email('Invalid email').optional().or(z.literal('')),
});

export const invoiceItemSchema = z.object({
  orderItemId:         z.number().int().positive().optional(),
  bookFormatVariantId: z.number().int().positive().optional(),
  itemType:            InvoiceItemTypeEnum,
  title:               z.string().min(1, 'Item title is required').max(255),
  format:              BookFormatEnum,
  sku:                 z.string().max(100).optional(),
  fileDeliveryUrl:     z
    .string()
    .url('Must be a valid URL')
    .optional()
    .or(z.literal('')),
  quantity:      z.number().int().min(1, 'Quantity must be at least 1'),
  unitPrice:     z.number().positive('Unit price must be greater than 0'),
  taxRate:       z.number().min(0).max(100).optional(),
  discountAmount: z.number().min(0).optional(),
});

// ── Main invoice schema ────────────────────────────────────────────────────

const baseInvoiceSchema = z.object({
  orderId:      z.number().int().positive('A valid Order ID is required'),
  items:        z.array(invoiceItemSchema).min(1, 'At least one line item is required'),
  invoiceDate:  z.string().min(1, 'Invoice date is required'),
  dueDate:      z.string().optional(),
  currency:     z.string().max(3).default('INR'),
  taxRate:      z.number().min(0).max(100).optional(),
  discountAmount: z.number().min(0).optional(),

  // Both address fields are structurally optional at the schema level.
  // The superRefine below enforces the business rule dynamically.
  shippingAddress: shippingAddressSchema.optional(),
  billingAddress:  billingAddressSchema.optional(),

  gatewayTransactionRef: z.string().max(120).optional(),
  notes:                 z.string().optional(),
});

/**
 * Final schema with cross-field validation.
 *
 * Business rule (mirrors the backend @ValidateIf decorator):
 *   If ANY item has itemType === 'TANGIBLE', shippingAddress MUST be provided
 *   and all its required sub-fields must be filled.
 */
export const createInvoiceSchema = baseInvoiceSchema.superRefine((data, ctx) => {
  const hasTangible = data.items.some((item) => item.itemType === 'TANGIBLE');

  if (hasTangible && !data.shippingAddress) {
    ctx.addIssue({
      code:    z.ZodIssueCode.custom,
      message: 'Shipping address is required when the invoice contains tangible (physical) items.',
      path:    ['shippingAddress'],
    });
  }
});

// ── Inferred TypeScript types ──────────────────────────────────────────────

/**
 * What the form holds while the user is editing it. Fields with a schema
 * `.default()` (e.g. `currency`) are optional here and only become guaranteed
 * once the resolver has parsed the values, which is why this is distinct from
 * `CreateInvoiceFormValues` below.
 */
export type CreateInvoiceFormInput = z.input<typeof createInvoiceSchema>;

/** Parsed, defaults-applied values handed to the submit handler. */
export type CreateInvoiceFormValues = z.output<typeof createInvoiceSchema>;
export type InvoiceItemFormValues   = z.infer<typeof invoiceItemSchema>;
export type ShippingAddressValues   = z.infer<typeof shippingAddressSchema>;
export type BillingAddressValues    = z.infer<typeof billingAddressSchema>;

// ── Helpers ────────────────────────────────────────────────────────────────

export const BOOK_FORMAT_OPTIONS: { value: z.infer<typeof BookFormatEnum>; label: string }[] = [
  { value: 'hardcover', label: 'Hardcover' },
  { value: 'paperback', label: 'Paperback' },
  { value: 'physical',  label: 'Physical (other)' },
  { value: 'ebook',     label: 'eBook' },
  { value: 'pdf',       label: 'PDF' },
  { value: 'epub',      label: 'ePub' },
  { value: 'audiobook', label: 'Audiobook' },
  { value: 'docx',      label: 'DOCX' },
  { value: 'worksheet', label: 'Worksheet' },
];

export const TANGIBLE_FORMATS = new Set(['hardcover', 'paperback', 'physical'] as const);

export const DEFAULT_INVOICE_ITEM: InvoiceItemFormValues = {
  itemType:      'INTANGIBLE',
  title:         '',
  format:        'pdf',
  quantity:      1,
  unitPrice:     0,
  sku:           undefined,
  fileDeliveryUrl: undefined,
  taxRate:       0,
  discountAmount: 0,
};
