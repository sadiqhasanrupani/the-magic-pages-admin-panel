import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { CreateBookDto, Book, BookFormData } from '@/types/book.types';

// API functions
export const booksApi = {
  // Create a new book
  createBook: async (formData: FormData): Promise<Book> => {
    const response = await apiClient.post('/books', formData);
    return response.data;
  },

  // Get all books
  getBooks: async (): Promise<Book[]> => {
    const response = await apiClient.get('/books');
    return response.data;
  },

  // Get book by ID
  getBook: async (id: number): Promise<Book> => {
    const response = await apiClient.get(`/books/${id}`);
    return response.data;
  },

  // Update book
  updateBook: async (id: number, formData: FormData): Promise<Book> => {
    const response = await apiClient.put(`/books/${id}`, formData);
    return response.data;
  },

  // Delete book
  deleteBook: async (id: number): Promise<void> => {
    await apiClient.delete(`/books/${id}`);
  },
};

// Query keys
export const bookQueryKeys = {
  all: ['books'] as const,
  lists: () => [...bookQueryKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...bookQueryKeys.lists(), { filters }] as const,
  details: () => [...bookQueryKeys.all, 'detail'] as const,
  detail: (id: number) => [...bookQueryKeys.details(), id] as const,
};

// Helper function to convert form data to FormData
export const createBookFormData = (data: BookFormData): FormData => {
  const formData = new FormData();
  
  // Basic fields
  formData.append('title', data.title);
  formData.append('description', data.description);
  formData.append('genre', data.genre as string);
  formData.append('format', data.format);
  formData.append('availability', data.availability);
  formData.append('authorName', data.authorName);
  formData.append('price', data.price.toString());
  formData.append('rating', data.rating.toString());
  
  // Published date
  if (data.publishedDate) {
    formData.append('publishedDate', data.publishedDate.toISOString());
  }
  
  // Optional author ID
  if (data.authorId) {
    formData.append('authorId', data.authorId.toString());
  }
  
  // File uploads
  if (data.coverImage) {
    formData.append('coverImage', data.coverImage);
  }
  
  if (data.snapshots && data.snapshots.length > 0) {
    data.snapshots.forEach((snapshot, index) => {
      formData.append('snapshots', snapshot);
    });
  }

  if (data.bookFiles && data.bookFiles.length > 0) {
    data.bookFiles.forEach((bookFile, index) => {
      formData.append('bookFiles', bookFile);
    });
  }
  
  return formData;
};

// React Query Hooks
export const useCreateBook = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: BookFormData) => {
      const formData = createBookFormData(data);
      return booksApi.createBook(formData);
    },
    onSuccess: () => {
      // Invalidate and refetch books list
      queryClient.invalidateQueries({ queryKey: bookQueryKeys.lists() });
    },
    onError: (error) => {
      console.error('Error creating book:', error);
    },
  });
};

export const useBooks = () => {
  return useQuery({
    queryKey: bookQueryKeys.lists(),
    queryFn: booksApi.getBooks,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useBook = (id: number) => {
  return useQuery({
    queryKey: bookQueryKeys.detail(id),
    queryFn: () => booksApi.getBook(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};