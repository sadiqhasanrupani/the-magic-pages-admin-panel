import * as Yup from 'yup';
import { BookGenre, BookFormat, BookAvailability } from '@/types/book.types';

/**
 * Helper functions for common file validation logic.
 */
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_BOOK_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_BOOK_TYPES = [
  'application/pdf',
  'application/epub+zip',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'application/rtf',
  'application/vnd.oasis.opendocument.text',
];

/**
 * Main validation schema for the Create Book form.
 */
export const createBookValidationSchema = Yup.object({
  // Basic Information
  title: Yup.string()
    .required('Title is required')
    .max(255, 'Title must be at most 255 characters'),

  description: Yup.string()
    .required('Description is required')
    .min(10, 'Description must be at least 10 characters long'),

  genre: Yup.mixed<BookGenre>()
    .oneOf(Object.values(BookGenre), 'Please select a valid genre')
    .required('Genre is required'),

  format: Yup.mixed<BookFormat>()
    .oneOf(Object.values(BookFormat), 'Please select a valid format')
    .required('Format is required'),

  availability: Yup.mixed<BookAvailability>()
    .oneOf(Object.values(BookAvailability), 'Please select a valid availability status')
    .required('Availability is required'),

  authorName: Yup.string()
    .required('Author name is required')
    .min(2, 'Author name must be at least 2 characters')
    .max(100, 'Author name must be at most 100 characters'),

  publishedDate: Yup.date()
    .typeError('Invalid date format')
    .required('Published date is required')
    .max(new Date(), 'Published date cannot be in the future'),

  price: Yup.number()
    .typeError('Price must be a valid number')
    .required('Price is required')
    .min(0, 'Price must be a positive number')
    .test('decimal', 'Price must have at most 2 decimal places', (value) => {
      if (value === undefined || value === null) return true;
      return /^\d+(\.\d{1,2})?$/.test(value.toString());
    }),

  rating: Yup.number()
    .typeError('Rating must be a number')
    .required('Rating is required')
    .min(0, 'Rating must be at least 0')
    .max(5, 'Rating cannot exceed 5')
    .test('decimal', 'Rating must have at most 1 decimal place', (value) => {
      if (value === undefined || value === null) return true;
      return /^\d+(\.\d{1})?$/.test(value.toString());
    }),

  authorId: Yup.number()
    .nullable()
    .transform((value) => (Number.isNaN(value) ? null : value))
    .integer('Author ID must be an integer')
    .min(1, 'Author ID must be a positive integer')
    .optional(),

  //  File Uploads
  coverImage: Yup.mixed<File>()
    .nullable()
    .test('fileSize', 'Cover image must be smaller than 10MB', (file) =>
      !file ? true : file.size <= MAX_IMAGE_SIZE,
    )
    .test('fileType', 'Only image files are allowed', (file) =>
      !file ? true : ALLOWED_IMAGE_TYPES.includes(file.type),
    ),

  snapshots: Yup.array()
    .of(
      Yup.mixed<File>()
        .test('fileSize', 'Each snapshot must be smaller than 10MB', (file) =>
          !file ? true : file.size <= MAX_IMAGE_SIZE,
        )
        .test('fileType', 'Only image files are allowed', (file) =>
          !file ? true : ALLOWED_IMAGE_TYPES.includes(file.type),
        ),
    )
    .optional()
    .test('snapshotCount', 'Invalid number of snapshots', function(files) {
      if (!files || files.length === 0) return true;
      const { format } = this.parent;

      if (format === BookFormat.EBOOK) {
        return files.length === 10 || this.createError({ message: 'E-book requires exactly 10 snapshots' });
      }
      if ([BookFormat.PAPERBACK, BookFormat.HARDCOVER].includes(format)) {
        return files.length === 5 || this.createError({ message: 'Physical books require exactly 5 snapshots' });
      }
      return true;
    }),

  bookFiles: Yup.array()
    .of(
      Yup.mixed<File>()
        .test('fileSize', 'Each book file must be smaller than 50MB', (file) =>
          !file ? true : file.size <= MAX_BOOK_FILE_SIZE,
        )
        .test('fileType', 'Invalid book file type', (file) =>
          !file ? true : ALLOWED_BOOK_TYPES.includes(file.type),
        ),
    )
    .optional()
    .test('ebookRequired', 'E-book format requires at least one file', function(files) {
      const { format } = this.parent;
      if (format === BookFormat.EBOOK) {
        return files && files.length > 0;
      }
      return true;
    }),

  // Optional flags
  isBestseller: Yup.boolean().optional(),
  isFeatured: Yup.boolean().optional(),
  isNewRelease: Yup.boolean().optional(),
  allowReviews: Yup.boolean().optional(),
  allowWishlist: Yup.boolean().optional(),
  enableNotifications: Yup.boolean().optional(),

  // Visibility options
  visibility: Yup.string()
    .oneOf(['public', 'private', 'draft'], 'Please select a valid visibility option')
    .optional(),
});

export type CreateBookFormValues = Yup.InferType<typeof createBookValidationSchema>;
