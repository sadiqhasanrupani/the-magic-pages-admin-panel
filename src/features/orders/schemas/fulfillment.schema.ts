import * as z from 'zod';

/**
 * Client-side mirror of the SHIPPED branch of `UpdateOrderFulfillmentDto`.
 *
 * Deliberately only models the SHIPPED case: it is the one transition that
 * carries a body worth validating. DELIVERED takes no fields, so it fires
 * straight from a confirm dialog with no form at all.
 *
 * Max lengths track the server's `@MaxLength` decorators exactly (100 / 100 /
 * 500 / 500) so an over-long value fails inline instead of costing a
 * round-trip.
 */
export const markShippedSchema = z.object({
  carrier: z
    .string()
    .trim()
    .min(1, 'Carrier is required.')
    .max(100, 'Carrier must be 100 characters or fewer.'),
  trackingNumber: z
    .string()
    .trim()
    .min(1, 'Tracking number is required.')
    .max(100, 'Tracking number must be 100 characters or fewer.'),
  // Empty string is the untouched state of an optional input; allow it here and
  // strip it to `undefined` at submit so the server sees an absent key rather
  // than a value that would fail @IsUrl.
  trackingUrl: z
    .union([
      z.literal(''),
      z
        .string()
        .trim()
        .max(500, 'Tracking URL must be 500 characters or fewer.')
        .refine(
          (value) => /^https?:\/\//i.test(value),
          'Tracking URL must start with http:// or https://.',
        )
        .refine((value) => {
          try {
            new URL(value);
            return true;
          } catch {
            return false;
          }
        }, 'Enter a valid URL.'),
    ])
    .optional(),
  comment: z
    .string()
    .trim()
    .max(500, 'Note must be 500 characters or fewer.')
    .optional(),
});

export type MarkShippedFormValues = z.infer<typeof markShippedSchema>;

export const DEFAULT_MARK_SHIPPED_VALUES: MarkShippedFormValues = {
  carrier: '',
  trackingNumber: '',
  trackingUrl: '',
  comment: '',
};
