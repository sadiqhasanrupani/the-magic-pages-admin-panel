import * as Yup from 'yup';
import { BookGenre, BookFormat, BookAvailability } from '@/types/book.types';

export const createBookValidationSchema = Yup.object({
  title: Yup.string()
    .required('Title is required')
    .max(255, 'Title must be at most 255 characters'),
  
  description: Yup.string()
    .required('Description is required')
    .min(10, 'Description must be at least 10 characters'),
  
  genre: Yup.string()
    .oneOf(Object.values(BookGenre), 'Please select a valid genre')
    .required('Genre is required'),
  
  format: Yup.string()
    .oneOf(Object.values(BookFormat), 'Please select a valid format')
    .required('Format is required'),
  
  availability: Yup.string()
    .oneOf(Object.values(BookAvailability), 'Please select a valid availability status')
    .required('Availability is required'),
  
  authorName: Yup.string()
    .required('Author name is required')
    .min(2, 'Author name must be at least 2 characters')
    .max(100, 'Author name must be at most 100 characters'),
  
  publishedDate: Yup.date()
    .required('Published date is required')
    .max(new Date(), 'Published date cannot be in the future'),
  
  price: Yup.number()
    .required('Price is required')
    .min(0, 'Price must be a positive number')
    .test('decimal', 'Price must have at most 2 decimal places', (value) => {
      if (value === undefined) return true;
      return Number(value.toFixed(2)) === value;
    }),
  
  rating: Yup.number()
    .required('Rating is required')
    .min(0, 'Rating must be between 0 and 5')
    .max(5, 'Rating must be between 0 and 5')
    .test('decimal', 'Rating must have at most 1 decimal place', (value) => {
      if (value === undefined) return true;
      return Number(value.toFixed(1)) === value;
    }),
  
  // Optional fields
  authorId: Yup.number()
    .optional()
    .integer('Author ID must be an integer')
    .min(1, 'Author ID must be a positive integer'),
  
  coverImage: Yup.mixed<File>()
    .optional()
    .test('fileSize', 'File size must be less than 10MB', (value) => {
      if (!value) return true;
      return value.size <= 10 * 1024 * 1024; // 10MB
    })
    .test('fileType', 'Only image files are allowed', (value) => {
      if (!value) return true;
      return value.type.startsWith('image/');
    }),
  
  snapshots: Yup.array()
    .of(
      Yup.mixed<File>()
        .test('fileSize', 'Each file must be less than 10MB', (value) => {
          if (!value) return true;
          return value.size <= 10 * 1024 * 1024; // 10MB
        })
        .test('fileType', 'Only image files are allowed', (value) => {
          if (!value) return true;
          return value.type.startsWith('image/');
        })
    )
    .optional()
    .test('snapshotCount', 'Invalid number of snapshots', function (value) {
      if (!value || value.length === 0) return true;
      
      const { format } = this.parent;
      
      if (format === BookFormat.EBOOK) {
        return value.length === 10;
      } else if ([BookFormat.HARDCOVER, BookFormat.PAPERBACK].includes(format)) {
        return value.length === 5;
      }
      
      // For audiobook or other formats, no specific requirement
      return true;
    }),

  bookFiles: Yup.array()
    .of(
      Yup.mixed<File>()
        .test('fileSize', 'Each file must be less than 50MB', (value) => {
          if (!value) return true;
          return value.size <= 50 * 1024 * 1024; // 50MB
        })
        .test('fileType', 'Invalid file type for book', (value) => {
          if (!value) return true;
          const allowedTypes = [
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
          return allowedTypes.includes(value.type);
        })
    )
    .optional()
    .test('ebookRequired', 'eBook format requires at least one book file', function (value) {
      const { format } = this.parent;
      if (format === BookFormat.EBOOK) {
        return value && value.length > 0;
      }
      return true;
    }),

  // Availability & Settings validation
  isBestseller: Yup.boolean().optional(),
  isFeatured: Yup.boolean().optional(),
  isNewRelease: Yup.boolean().optional(),
  allowReviews: Yup.boolean().optional(),
  allowWishlist: Yup.boolean().optional(),
  enableNotifications: Yup.boolean().optional(),
  visibility: Yup.string()
    .oneOf(['public', 'private', 'draft'], 'Please select a valid visibility option')
    .optional(),
});

export type CreateBookFormValues = Yup.InferType<typeof createBookValidationSchema>;