// --- Book Variant ---
export interface BookVariant {
  id: string;
  format: 'hardcover' | 'paperback' | 'ebook' | 'audiobook';
  originalPrice?: { amount: string; currency: string; display: string };
  price: { amount: string; currency: string; display: string };
  discountPercentage?: number;
  stockQuantity: number;
  isbn?: string;
  includeTax?: boolean;
  taxPercentage?: number;
}

export interface CreateBookVariantDto {
  format: 'hardcover' | 'paperback' | 'ebook' | 'audiobook';
  originalPriceCents?: number;
  priceCents: number;
  stockQuantity: number;
  isbn?: string;
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
