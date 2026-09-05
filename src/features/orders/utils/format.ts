/**
 * Display formatters for the orders feature.
 *
 * WHY NOT REUSE `invoice-columns.tsx`'s `formatCurrency`: that one takes a
 * decimal rupee STRING (`"1499.00"`) because invoice numeric columns are
 * serialised by TypeORM as strings. The orders contract sends INTEGER PAISE
 * (`149900`). Passing paise to the invoice formatter would render ₹149,900.00
 * — a 100x overstatement on every screen. Same `Intl.NumberFormat` config,
 * different input unit, so it needs its own function.
 */

/** Format an integer paise amount as localised currency. */
export const formatPaise = (paise: number, currency = 'INR'): string =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format((Number(paise) || 0) / 100);

/** Short date, matching the invoices table (`12 Mar 2026`). */
export const formatDate = (iso: string | null): string => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

/** Date + time, for shipped/delivered audit timestamps. */
export const formatDateTime = (iso: string | null): string => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Only render a tracking URL as an anchor when it is http(s).
 *
 * The server validates this on write, but old rows and any future
 * write path that bypasses the DTO are not this component's to trust —
 * a `javascript:` href would be an XSS sink.
 */
export const isSafeHttpUrl = (url: string | null): boolean => {
  if (!url) return false;
  try {
    const { protocol } = new URL(url);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
};
