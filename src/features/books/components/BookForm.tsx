"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { bookKeys, useBookMutation } from "../hooks/useBooks";
// Removed transformers as we now use direct price binding
// import { formatPriceForApi, formatPriceForForm } from "../utils/transformers"; 
import { ImageUploader } from "./ImageUploader";
import { SingleImageUploader } from "./SingleImageUploader";
import { MOCK_CATEGORIES, MOCK_AGE_GROUPS } from "../constants";
import type { Book, CreateBookPayload } from "../types/books.types";
import { useAgeGroupsQuery } from "@/features/age-groups/hooks/useAgeGroups";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useCategoriesQuery } from "@/features/categories/hooks/useCategories";
import Header from "@/components/header";
import { queryClient } from "@/providers/query-provider";

// --- Schema Definition ---

// Helper to calculate discount percentage
const calculateDiscountPercentage = (originalPrice: number, discountedPrice: number): number => {
  if (!originalPrice || originalPrice <= 0 || discountedPrice >= originalPrice) return 0;
  return Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);
};

const bookVariantSchema = z.object({
  format: z.enum(["hardcover", "paperback", "ebook", "audiobook"]),
  originalPrice: z.number().min(0, "Original price must be positive").optional(),
  price: z.number().min(0, "Discounted price must be positive"),
  stockQuantity: z.number().int().min(0),
  isbn: z.string().optional(),
  includeTax: z.boolean().default(false),
  taxPercentage: z.number().min(0, "Tax must be positive").max(100, "Tax cannot exceed 100%").optional(),
}).refine(
  (data) => {
    // If original price is set, discounted price must be less
    if (data.originalPrice !== undefined && data.originalPrice > 0) {
      return data.price < data.originalPrice;
    }
    return true;
  },
  { message: "Discounted price must be less than original price", path: ["price"] }
).refine(
  (data) => {
    // If includeTax is true, taxPercentage is required
    if (data.includeTax) {
      return data.taxPercentage !== undefined && data.taxPercentage > 0;
    }
    return true;
  },
  { message: "Tax percentage is required when tax is included", path: ["taxPercentage"] }
);

const bookFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  authorName: z.string().min(1, "Author name is required"),
  genre: z.string().optional(),

  slug: z.string().optional(),

  // Categorization
  categoryIds: z.array(z.string()).default([]),
  ageGroupIds: z.array(z.string()).default([]),

  shortDescription: z.string().optional(),
  bullets: z.array(z.object({ value: z.string() })).default([]),

  // Images
  coverImageUrl: z.string().url("Valid URL required").optional().or(z.literal("")),
  snapshots: z.array(z.string()).default([]),

  // Status Flags
  visibility: z.enum(["public", "private", "draft"]),
  isFeatured: z.boolean().default(false),
  isBestseller: z.boolean().default(false),
  isNewRelease: z.boolean().default(false),
  allowReviews: z.boolean().default(true),
  allowWishlist: z.boolean().default(true),

  // SEO
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),

  // Variants (Array)
  variants: z.array(bookVariantSchema).min(1, "At least one variant is required"),
});

// --- Inferred Type (Golden Source) ---
export type BookFormValues = z.infer<typeof bookFormSchema>;

interface BookFormProps {
  initialData?: Book;
}

export function BookForm({ initialData }: BookFormProps) {
  const router = useRouter();

  const {
    data: ageGroupData,
    isLoading: ageGroupIsLoading,
    isPending: ageGroupIsPending,
    isError: ageGroupIsError,
    error: ageGroupError
  } = useAgeGroupsQuery();

  const {
    data: categoriesData,
    isLoading: categoriesIsLoading,
    isPending: categoriesIsPending,
    isError: categoriesIsError,
    error: categoriesError
  } = useCategoriesQuery();


  const { createMutation, updateMutation } = useBookMutation();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  // --- Default Values Logic ---
  const defaultValues: BookFormValues = initialData
    ? {
      title: initialData.title,
      subtitle: initialData.subtitle,
      description: initialData.description,
      authorName: initialData.authorName,
      slug: initialData.slug,
      shortDescription: initialData.shortDescription,
      bullets: (initialData.bullets || []).map(b => ({ value: b })),
      categoryIds: initialData.categoryIds || [],
      ageGroupIds: initialData.ageGroupIds || [],
      coverImageUrl: initialData.coverImageUrl,
      snapshots: initialData.snapshotUrls || [],
      // Ensure visibility is lowercase to match select options
      visibility: (initialData.visibility?.toLowerCase() as "public" | "private" | "draft") || "draft",
      isFeatured: initialData.isFeatured,
      isBestseller: initialData.isBestseller,
      isNewRelease: initialData.isNewRelease,
      allowReviews: initialData.allowReviews,
      allowWishlist: initialData.allowWishlist,
      metaTitle: initialData.metaTitle,
      metaDescription: initialData.metaDescription,
      variants: (initialData.variants || []).map((v) => ({
        format: v.format,
        originalPrice: v.originalPrice ? Number(v.originalPrice.amount) : undefined,
        price: Number(v.price.amount), // Extract amount from price object (discounted price)
        stockQuantity: v.stockQuantity,
        isbn: v.isbn,
        includeTax: v.includeTax ?? false,
        taxPercentage: v.taxPercentage,
      })),
      genre: initialData.genre || "",
    }
    : {
      title: "",
      subtitle: "",
      description: "",
      authorName: "",
      shortDescription: "",
      bullets: [],
      categoryIds: [],
      ageGroupIds: [],
      genre: "fantasy",
      snapshots: [],
      coverImageUrl: "",
      visibility: "draft",
      isFeatured: false,
      isBestseller: false,
      isNewRelease: true,
      allowReviews: true,
      allowWishlist: true,
      metaTitle: "",
      metaDescription: "",
      variants: [
        { format: "paperback", originalPrice: undefined, price: 0, stockQuantity: 0, isbn: "", includeTax: false, taxPercentage: undefined },
      ],
    };

  const form = useForm<BookFormValues>({
    resolver: zodResolver(bookFormSchema) as any,
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "variants",
  });

  const { fields: bulletFields, append: appendBullet, remove: removeBullet } = useFieldArray({
    control: form.control,
    name: "bullets",
  });

  // --- Submission Handler ---
  const onSubmit = async (values: BookFormValues) => {
    // Construct payload
    const payload: CreateBookPayload = {
      title: values.title,
      subtitle: values.subtitle,
      description: values.description,
      authorName: values.authorName,
      slug: values.slug,
      categoryIds: values.categoryIds,
      ageGroupIds: values.ageGroupIds,
      shortDescription: values.shortDescription,
      bullets: values.bullets.map(b => b.value),

      // Backend expects lowercase genre
      genre: values.genre?.toLowerCase(),

      coverImageUrl: values.coverImageUrl,

      snapshots: values.snapshots
        .filter((url): url is string => typeof url === 'string' && url.length > 0)
        .map(url => {
          // If it's already a full URL, ensure it doesn't use 'localhost' which backend might block
          if (url.startsWith('http')) {
            return url.replace('localhost', '127.0.0.1');
          }

          // Fix relative URLs
          const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8080/api/v1';
          const baseUrl = apiBase.replace(/\/api\/v1\/?$/, '').replace('localhost', '127.0.0.1');
          return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
        }),

      visibility: values.visibility,
      isFeatured: values.isFeatured,
      isBestseller: values.isBestseller,
      isNewRelease: values.isNewRelease,
      allowReviews: values.allowReviews,
      allowWishlist: values.allowWishlist,
      metaTitle: values.metaTitle,
      metaDescription: values.metaDescription,

      variants: values.variants.map((v) => ({
        format: v.format,
        stockQuantity: v.stockQuantity,
        isbn: v.isbn,
        originalPriceCents: v.originalPrice ? Math.round(v.originalPrice * 100) : undefined,
        priceCents: Math.round(v.price * 100), // Convert to cents
        includeTax: v.includeTax,
        taxPercentage: v.includeTax ? v.taxPercentage : undefined,
      })),
    };


    try {
      if (initialData) {
        await updateMutation.mutateAsync({ id: initialData.id, payload });
      } else {
        await createMutation.mutateAsync(payload);

        queryClient.invalidateQueries({
          queryKey: bookKeys.list({ limit: 50 }),
          exact: true,
        });

        router.push("/admin/books"); // Redirect on create success
      }
    } catch (error) {
      // Error handled by mutation onError toast
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Header
          title={initialData ? "Edit Book" : "Create New Book"}
          isSubmitting={isSubmitting}
          description={`Fill in the details below to ${initialData ? "update" : "create"} a book.`}
          buttonText={initialData ? "Save Changes" : "Create Book"}
          showButton={true}
        />

        {/* --- GRID LAYOUT --- */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">

          {/* LEFT COLUMN: Cover Image (Visual Anchor) */}
          <div className="md:col-span-4 lg:col-span-3 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Cover Image</CardTitle>
                <CardDescription>
                  This is the main image displayed on the storefront.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control as any}
                  name="coverImageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <SingleImageUploader
                          value={field.value}
                          onChange={field.onChange}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Status</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control as any}
                  name="visibility"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Visibility</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select visibility" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="public">Public</SelectItem>
                          <SelectItem value="private">Private</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="space-y-3 pt-2">
                  <FormField
                    control={form.control as any}
                    name="isFeatured"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                        <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        <FormLabel className="text-sm font-normal">Featured</FormLabel>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control as any}
                    name="isBestseller"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                        <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        <FormLabel className="text-sm font-normal">Bestseller</FormLabel>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control as any}
                    name="isNewRelease"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                        <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        <FormLabel className="text-sm font-normal">New Release</FormLabel>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT COLUMN: Details & Variants */}
          <div className="md:col-span-8 lg:col-span-9 space-y-6">

            {/* Section 1: Basic Details */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Details</CardTitle>
                <CardDescription>
                  Title, author, and description.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control as any}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="The Great Gatsby" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control as any}
                    name="authorName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Author Name</FormLabel>
                        <FormControl>
                          <Input placeholder="F. Scott Fitzgerald" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control as any}
                    name="genre"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Genre</FormLabel>
                        <FormControl>
                          <Input placeholder="Fiction" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control as any}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="A summary of the book..."
                          className="resize-none min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control as any}
                  name="shortDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Short Description</FormLabel>
                      <FormControl>
                        <Input placeholder="One-line summary..." {...field} />
                      </FormControl>
                      <FormDescription>Used in product cards and previews.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Section 2: Variants */}
            <Card>
              <CardHeader>
                <CardTitle>Variants (Pricing & Stock)</CardTitle>
                <CardDescription>
                  Manage different formats (Hardcover, Ebook, etc).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {fields.map((field, index) => {
                  // Watch values for this variant to calculate discount
                  const originalPrice = form.watch(`variants.${index}.originalPrice`);
                  const discountedPrice = form.watch(`variants.${index}.price`);
                  const includeTax = form.watch(`variants.${index}.includeTax`);
                  const discountPercent = calculateDiscountPercentage(originalPrice || 0, discountedPrice || 0);

                  return (
                    <div key={field.id} className="relative grid gap-4 p-4 border rounded-lg bg-muted/20">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-2 text-destructive hover:bg-destructive/10"
                        onClick={() => remove(index)}
                        disabled={fields.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>

                      {/* Row 1: Format & ISBN */}
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control as any}
                          name={`variants.${index}.format`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Format</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Format" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="hardcover">Hardcover</SelectItem>
                                  <SelectItem value="paperback">Paperback</SelectItem>
                                  <SelectItem value="ebook">E-Book</SelectItem>
                                  <SelectItem value="audiobook">Audiobook</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control as any}
                          name={`variants.${index}.isbn`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>ISBN</FormLabel>
                              <FormControl>
                                <Input placeholder="978-..." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Row 2: Original Price & Discounted Price with badge */}
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control as any}
                          name={`variants.${index}.originalPrice`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Original Price (₹)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="500.00"
                                  value={field.value ?? ""}
                                  onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                />
                              </FormControl>
                              <FormDescription>Leave empty if no discount</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control as any}
                          name={`variants.${index}.price`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                {originalPrice ? "Discounted Price (₹)" : "Price (₹)"}
                                {discountPercent > 0 && (
                                  <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                                    {discountPercent}% OFF
                                  </span>
                                )}
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="399.00"
                                  {...field}
                                  onChange={e => field.onChange(Number(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Row 3: Stock */}
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control as any}
                          name={`variants.${index}.stockQuantity`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Stock</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="50"
                                  {...field}
                                  onChange={e => field.onChange(Number(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Row 4: Tax Section */}
                      <div className="border-t pt-4 space-y-3">
                        <FormField
                          control={form.control as any}
                          name={`variants.${index}.includeTax`}
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal">Include Tax</FormLabel>
                            </FormItem>
                          )}
                        />

                        {includeTax && (
                          <FormField
                            control={form.control as any}
                            name={`variants.${index}.taxPercentage`}
                            render={({ field }) => (
                              <FormItem className="ml-6">
                                <FormLabel>Tax Percentage (%)</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    max="100"
                                    placeholder="18"
                                    className="w-32"
                                    value={field.value ?? ""}
                                    onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => append({ format: "paperback", originalPrice: undefined, price: 0, stockQuantity: 0, isbn: "", includeTax: false, taxPercentage: undefined })}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Variant
                </Button>
              </CardContent>
            </Card>

            {/* Section 3: Media Gallery (Snapshots) */}
            <Card>
              <CardHeader>
                <CardTitle>Media Gallery</CardTitle>
                <CardDescription>
                  Upload additional preview snapshots.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control as any}
                  name="snapshots"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <ImageUploader
                          value={field.value as string[]}
                          onChange={field.onChange}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormDescription>
                        Drag and drop images for the book gallery.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Section 4: Categorization */}
            <Card>
              <CardHeader>
                <CardTitle>Categorization</CardTitle>
                <CardDescription>
                  Select categories and age groups.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Categories */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Categories</h4>

                    <div
                      className={cn(
                        "grid grid-cols-2 gap-2 transition-opacity",
                        (categoriesIsLoading || categoriesIsPending) &&
                        "opacity-60 pointer-events-none"
                      )}
                    >
                      {/* Loading state (in-place skeletons) */}
                      {(categoriesIsLoading || categoriesIsPending) &&
                        Array.from({ length: 6 }).map((_, i) => (
                          <div key={i} className="flex items-center space-x-2">
                            <Skeleton className="h-4 w-4 rounded-sm" />
                            <Skeleton className="h-4 w-24" />
                          </div>
                        ))}

                      {/* Error state */}
                      {categoriesIsError && (
                        <p className="col-span-2 text-sm text-destructive">
                          Failed to load categories
                        </p>
                      )}

                      {/* Success state */}
                      {!categoriesIsLoading &&
                        !categoriesIsPending &&
                        !categoriesIsError &&
                        categoriesData?.data?.map((cat) => (
                          <FormField
                            key={cat.id}
                            control={form.control as any}
                            name="categoryIds"
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(cat.id)}
                                    onCheckedChange={(checked) =>
                                      checked
                                        ? field.onChange([...(field.value || []), cat.id])
                                        : field.onChange(
                                          (field.value || []).filter(
                                            (value: string) => value !== cat.id
                                          )
                                        )
                                    }
                                  />
                                </FormControl>

                                <FormLabel className="text-sm font-normal">
                                  {cat.name}
                                </FormLabel>
                              </FormItem>
                            )}
                          />
                        ))}
                    </div>
                  </div>

                  {/* Age Groups */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Age Groups</h4>

                    <div
                      className={cn(
                        "grid grid-cols-2 gap-2 transition-opacity",
                        (ageGroupIsLoading || ageGroupIsPending) && "opacity-60 pointer-events-none"
                      )}
                    >
                      {(ageGroupIsLoading || ageGroupIsPending)
                        ? Array.from({ length: 6 }).map((_, i) => (
                          <div key={i} className="flex items-center space-x-2">
                            {/* Checkbox placeholder */}
                            <Skeleton className="h-4 w-4 rounded-sm" />

                            {/* Label placeholder */}
                            <Skeleton className="h-4 w-20" />
                          </div>
                        ))
                        : ageGroupData?.data?.map((age) => (
                          <FormField
                            key={age.id}
                            control={form.control as any}
                            name="ageGroupIds"
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(age.id)}
                                    onCheckedChange={(checked) =>
                                      checked
                                        ? field.onChange([...(field.value || []), age.id])
                                        : field.onChange(
                                          (field.value || []).filter(
                                            (value: string) => value !== age.id
                                          )
                                        )
                                    }
                                  />
                                </FormControl>

                                <FormLabel className="text-sm font-normal">
                                  {age.label}
                                </FormLabel>
                              </FormItem>
                            )}
                          />
                        ))}
                    </div>
                  </div>
                </div>

                {/* Bullets */}
                <div className="space-y-4 pt-4 border-t">
                  <FormLabel>Key Features / Bullets</FormLabel>
                  <div className="space-y-2">
                    {bulletFields.map((field, index) => (
                      <div key={field.id} className="flex gap-2">
                        <FormField
                          control={form.control as any}
                          name={`bullets.${index}.value`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormControl>
                                <Input placeholder="e.g. Improves vocabulary" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeBullet(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => appendBullet({ value: "" })}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Bullet
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 5: SEO */}
            <Card>
              <CardHeader>
                <CardTitle>Search Engine Optimization</CardTitle>
                <CardDescription>
                  Optimize for search visibility.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control as any}
                    name="metaTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Meta Title</FormLabel>
                        <FormControl>
                          <Input placeholder="SEO Title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control as any}
                    name="metaDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Meta Description</FormLabel>
                        <FormControl>
                          <Input placeholder="SEO Description" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </form>
    </Form>
  );
}
