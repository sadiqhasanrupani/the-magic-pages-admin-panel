// Book Enums
export enum BookGenre {
  FICTION = 'fiction',
  NON_FICTION = 'non-fiction',
  MYSTERY = 'mystery',
  ROMANCE = 'romance',
  SCI_FI = 'sci-fi',
  FANTASY = 'fantasy',
  BIOGRAPHY = 'biography',
  HISTORY = 'history',
}

export enum BookFormat {
  HARDCOVER = 'hardcover',
  PAPERBACK = 'paperback',
  EBOOK = 'ebook',
  AUDIOBOOK = 'audiobook',
}

export enum BookAvailability {
  IN_STOCK = 'in-stock',
  PRE_ORDER = 'pre-order',
  OUT_OF_STOCK = 'out-of-stock',
}

// DTOs
export interface CreateAuthorDto {
  name: string;
  bio?: string;
}

export interface CreateBookDto {
  title: string;
  description: string;
  genre: BookGenre;
  format: BookFormat;
  availability: BookAvailability;
  authorId?: number;
  author?: CreateAuthorDto;
  authorName: string;
  publishedDate: string;
  price: number;
  rating: number;
  fileUrls?: string[];
  snapshotUrls?: string[];
  
  // Availability & Settings fields
  isBestseller?: boolean;
  isFeatured?: boolean;
  isNewRelease?: boolean;
  allowReviews?: boolean;
  allowWishlist?: boolean;
  enableNotifications?: boolean;
  visibility?: 'public' | 'private' | 'draft';
}

// Form types
export interface BookFormData {
  title: string;
  description: string;
  genre: BookGenre | '';
  format: BookFormat;
  availability: BookAvailability;
  authorId?: number;
  authorName: string;
  publishedDate: Date | undefined;
  price: number;
  rating: number;
  coverImage?: File;
  snapshots?: File[];
  bookFiles?: File[]; // For eBook files (PDF, EPUB, DOC, etc.)
  
  // Availability & Settings fields
  isBestseller?: boolean;
  isFeatured?: boolean;
  isNewRelease?: boolean;
  allowReviews?: boolean;
  allowWishlist?: boolean;
  enableNotifications?: boolean;
  visibility?: 'public' | 'private' | 'draft';
}

export interface Book {
  id: number;
  title: string;
  description: string;
  genre: BookGenre;
  format: BookFormat;
  availability: BookAvailability;
  authorName: string;
  publishedDate: string;
  price: number;
  rating: number;
  coverImageUrl?: string;
  snapshotUrls?: string[];
  createdAt: string;
  updatedAt: string;
}