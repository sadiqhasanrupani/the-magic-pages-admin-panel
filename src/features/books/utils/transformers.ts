/**
 * Converts backend price (cents/paise) to frontend form value (Rupees/Main Unit)
 * Example: 29900 -> 299
 */
export const formatPriceForForm = (cents: number): number => {
  return cents / 100;
};

/**
 * Converts frontend form value (Rupees/Main Unit) to backend price (cents/paise)
 * Example: 299 -> 29900
 * Uses Math.round to handle floating point precision issues
 */
export const formatPriceForApi = (rupees: number): number => {
  return Math.round(rupees * 100);
};
