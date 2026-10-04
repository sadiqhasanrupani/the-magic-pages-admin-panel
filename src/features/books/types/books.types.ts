// --- Book Variant ---

/**
 * Formats the admin panel's variant `<Select>` offers.
 *
 * The backend enum (`libs/contract/src/books/enums/book-format.enum.ts`) is
 * wider than this — it also carries `physical`, `pdf`, `epub`, `docx` and
 * `worksheet`. This union stays narrow because it types what the form can
 * actually produce; anything read back off the wire is classified with
 * `isPhysicalFormat` / `isDigitalFormat` from `../utils/book-format`, which are
 * written against the full backend set.
 */
export type BookFormat = 'hardcover' | 'paperback' | 'ebook' | 'audiobook';

export interface BookVariant {
  id: string;
  format: BookFormat;
  originalPrice?: { amount: string; currency: string; display: string };
  price: { amount: string; currency: string; display: string };
  discountPercentage?: number;
  stockQuantity: number;
  isbn?: string;
  includeTax?: boolean;
  taxPercentage?: number;

  /** Backend-computed physical/digital flag, mirrored from `isPhysicalFormat`. */
  isPhysical?: boolean;

  /**
   * Storage URL of the deliverable behind a digital variant — the ebook or
   * audiobook file itself, which buyers receive as a secure download link after
   * payment.
   *
   * Only ever populated for admin callers: `transformBookToResponse` strips it
   * for every public/storefront response, because a digital variant's `fileUrl`
   * *is* the paid product. Undefined on physical variants (nothing downloadable
   * ships with a hardcover) and on any digital variant that has no file attached
   * yet.
   */
  fileUrl?: string;
}

export interface CreateBookVariantDto {
  format: BookFormat;
  originalPriceCents?: number;
  priceCents: number;
  stockQuantity: number;
  isbn?: string;
  /**
   * Deliverable URL for digital variants, obtained from `POST /admin/upload`.
   * Omitted entirely for physical formats.
   */
  fileUrl?: string;
  includeTax?: boolean;
  taxPercentage?: number;
}

// --- Book ---
export interface Book {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  shortDescription?: string;
  bullets?: string[];

  slug: string;

  authorName: string;
  authorId?: string;

  coverImageUrl?: string;
  snapshots?: string[]; // Use this, ignore snapshotUrls

  snapshotUrls?: string[]; // Use this, ignore snapshotUrls

  variants: BookVariant[];

  categoryIds?: string[];
  ageGroupIds?: string[];

  genre?: string;

  // Flags
  isFeatured: boolean;
  isBestseller: boolean;
  isNewRelease: boolean;
  allowReviews: boolean;
  allowWishlist: boolean;
  visibility: 'public' | 'private' | 'draft';

  // SEO
  metaTitle?: string;
  metaDescription?: string;

  createdAt: string;
  updatedAt: string;
}

export interface CreateBookPayload {
  title: string;
  subtitle?: string;
  description?: string;
  shortDescription?: string;
  bullets?: string[];

  authorName: string;
  slug?: string;

  genre?: string;

  coverImageUrl?: string; // Valid URL
  snapshots?: string[];   // Valid URLs

  visibility?: 'public' | 'private' | 'draft';
  isBestseller?: boolean;
  isFeatured?: boolean;
  isNewRelease?: boolean;
  allowReviews?: boolean;
  allowWishlist?: boolean;

  categoryIds?: string[];
  ageGroupIds?: string[];

  metaTitle?: string;
  metaDescription?: string;

  variants: CreateBookVariantDto[];
}

export type UpdateBookPayload = Partial<CreateBookPayload>;

export interface FindAllResponse {
  data: Book[];
  meta: {
    itemsPerPage: number;
    totalItems: number;
    currentPage: number;
    totalPages: number;
  };
}

export interface BookQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  visibility?: 'draft' | 'public' | 'private' | 'all';
}
