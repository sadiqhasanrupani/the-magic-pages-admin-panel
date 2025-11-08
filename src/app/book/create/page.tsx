"use client";

import * as React from "react";
import { Formik, Form, Field, FieldProps } from "formik";
import { toast } from "sonner";
import { parseDate } from "chrono-node";
import { SiteHeader } from "@/components/site-header";
import { CalendarIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { FileUpload } from "@/components/ui/file-upload";
import { MultiFileUpload, BOOK_FILE_TYPES } from "@/components/ui/multi-file-upload";
import { createBookValidationSchema } from "@/schemas/book.schema";
import { useCreateBook } from "@/services/book.service";
import { BookGenre, BookFormat, BookAvailability, type BookFormData } from "@/types/book.types";

function formatDate(date: Date | undefined) {
  if (!date) {
    return "";
  }

  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

const initialValues: BookFormData = {
  title: "",
  description: "",
  genre: "" as BookGenre | "",
  format: BookFormat.PAPERBACK,
  availability: BookAvailability.IN_STOCK,
  authorName: "",
  publishedDate: undefined,
  price: 0,
  rating: 0,
  coverImage: undefined,
  snapshots: [],
  bookFiles: [],
  // Availability & Settings fields
  isBestseller: false,
  isFeatured: false,
  isNewRelease: false,
  allowReviews: true,
  allowWishlist: true,
  enableNotifications: false,
  visibility: "public",
};

export default function CreateBookPage() {
  const createBookMutation = useCreateBook();

  const handleSubmit = async (values: BookFormData) => {
    try {
      await createBookMutation.mutateAsync(values);
      toast.success("Book created successfully!");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to create book");
    }
  };

  return (
    <>
      <SiteHeader header="Book Management" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="px-4 lg:px-6">
              <Formik
                initialValues={initialValues}
                validationSchema={createBookValidationSchema}
                onSubmit={handleSubmit}
              >
                {({ errors, touched, setFieldValue, values, isSubmitting }) => (
                  <Form className="space-y-10">
                    
                    {/* Book Details Section */}
                    <div className="grid grid-cols-1 gap-x-8 gap-y-8 md:grid-cols-3">
                      <div className="px-4 sm:px-0">
                        <h2 className="text-base font-semibold leading-7">
                          Book Details
                        </h2>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                          Enter the basic information about the book. This information will be displayed to customers.
                        </p>
                      </div>

                      <div className="bg-card shadow-sm ring-1 ring-border sm:rounded-xl md:col-span-2">
                        <div className="px-4 py-6 sm:p-8">
                          <div className="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                            
                            {/* Title Field */}
                            <div className="sm:col-span-4">
                              <Field name="title">
                                {({ field, meta }: FieldProps) => (
                                  <div>
                                    <Label htmlFor="title">Book Title *</Label>
                                    <div className="mt-2">
                                      <Input
                                        {...field}
                                        id="title"
                                        placeholder="Enter book title"
                                        className={meta.error && meta.touched ? "border-red-500" : ""}
                                      />
                                    </div>
                                    {meta.error && meta.touched && (
                                      <p className="text-sm text-red-500 mt-1">{meta.error}</p>
                                    )}
                                  </div>
                                )}
                              </Field>
                            </div>

                            {/* Rating Field */}
                            <div className="sm:col-span-2">
                              <Field name="rating">
                                {({ field, meta }: FieldProps) => (
                                  <div>
                                    <Label htmlFor="rating">Rating (0-5) *</Label>
                                    <div className="mt-2">
                                      <Input
                                        {...field}
                                        id="rating"
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        max="5"
                                        placeholder="4.5"
                                        className={meta.error && meta.touched ? "border-red-500" : ""}
                                      />
                                    </div>
                                    {meta.error && meta.touched && (
                                      <p className="text-sm text-red-500 mt-1">{meta.error}</p>
                                    )}
                                  </div>
                                )}
                              </Field>
                            </div>

                            {/* Author Name Field */}
                            <div className="sm:col-span-3">
                              <Field name="authorName">
                                {({ field, meta }: FieldProps) => (
                                  <div>
                                    <Label htmlFor="authorName">Author Name *</Label>
                                    <div className="mt-2">
                                      <Input
                                        {...field}
                                        id="authorName"
                                        placeholder="Author name"
                                        className={meta.error && meta.touched ? "border-red-500" : ""}
                                      />
                                    </div>
                                    {meta.error && meta.touched && (
                                      <p className="text-sm text-red-500 mt-1">{meta.error}</p>
                                    )}
                                  </div>
                                )}
                              </Field>
                            </div>

                            {/* Genre Field */}
                            <div className="sm:col-span-3">
                              <Field name="genre">
                                {({ field, meta }: FieldProps) => (
                                  <div>
                                    <Label htmlFor="genre">Genre *</Label>
                                    <div className="mt-2">
                                      <Select
                                        value={field.value}
                                        onValueChange={(value) => setFieldValue("genre", value)}
                                      >
                                        <SelectTrigger className={meta.error && meta.touched ? "border-red-500" : ""}>
                                          <SelectValue placeholder="Select genre" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value={BookGenre.FICTION}>Fiction</SelectItem>
                                          <SelectItem value={BookGenre.NON_FICTION}>Non-Fiction</SelectItem>
                                          <SelectItem value={BookGenre.MYSTERY}>Mystery</SelectItem>
                                          <SelectItem value={BookGenre.ROMANCE}>Romance</SelectItem>
                                          <SelectItem value={BookGenre.SCI_FI}>Science Fiction</SelectItem>
                                          <SelectItem value={BookGenre.FANTASY}>Fantasy</SelectItem>
                                          <SelectItem value={BookGenre.BIOGRAPHY}>Biography</SelectItem>
                                          <SelectItem value={BookGenre.HISTORY}>History</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    {meta.error && meta.touched && (
                                      <p className="text-sm text-red-500 mt-1">{meta.error}</p>
                                    )}
                                  </div>
                                )}
                              </Field>
                            </div>

                            {/* Description Field */}
                            <div className="col-span-full">
                              <Field name="description">
                                {({ field, meta }: FieldProps) => (
                                  <div>
                                    <Label htmlFor="description">Book Description *</Label>
                                    <div className="mt-2">
                                      <textarea
                                        {...field}
                                        id="description"
                                        rows={4}
                                        className={`flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                                          meta.error && meta.touched ? "border-red-500" : ""
                                        }`}
                                        placeholder="Enter a compelling description of the book..."
                                      />
                                    </div>
                                    {meta.error && meta.touched && (
                                      <p className="text-sm text-red-500 mt-1">{meta.error}</p>
                                    )}
                                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                                      Write a detailed description that will attract readers.
                                    </p>
                                  </div>
                                )}
                              </Field>
                            </div>

                            {/* Cover Image Upload */}
                            <div className="col-span-full">
                              <FileUpload
                                label="Book Cover Image"
                                files={values.coverImage ? [values.coverImage] : []}
                                onFilesChange={(files) => setFieldValue("coverImage", files[0])}
                                error={touched.coverImage && errors.coverImage ? String(errors.coverImage) : undefined}
                                helperText="Upload a high-quality cover image for your book"
                                maxFiles={1}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section Separator */}
                    <Separator className="my-8" />

                    {/* Publishing Information Section */}
                    <div className="grid grid-cols-1 gap-x-8 gap-y-8 pt-10 md:grid-cols-3">
                      <div className="px-4 sm:px-0">
                        <h2 className="text-base font-semibold leading-7">
                          Publishing Information
                        </h2>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                          Enter publishing details, pricing, and physical specifications of the book.
                        </p>
                      </div>

                      <div className="bg-card shadow-sm ring-1 ring-border sm:rounded-xl md:col-span-2">
                        <div className="px-4 py-6 sm:p-8">
                          <div className="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                            
                            {/* Published Date Field */}
                            <div className="sm:col-span-3">
                              <Field name="publishedDate">
                                {({ field, meta }: FieldProps) => {
                                  const [dateOpen, setDateOpen] = React.useState(false);
                                  const [dateValue, setDateValue] = React.useState("");
                                  const [month, setMonth] = React.useState<Date | undefined>(field.value);

                                  return (
                                    <div>
                                      <Label htmlFor="publishedDate">Published Date *</Label>
                                      <div className="mt-2 flex flex-col gap-3">
                                        <div className="relative flex gap-2">
                                          <Input
                                            value={dateValue || (field.value ? formatDate(field.value) : "")}
                                            placeholder="Select or type published date"
                                            className={`bg-background pr-10 ${meta.error && meta.touched ? "border-red-500" : ""}`}
                                            onChange={(e) => {
                                              setDateValue(e.target.value);
                                              const date = parseDate(e.target.value);
                                              if (date) {
                                                setFieldValue("publishedDate", date);
                                                setMonth(date);
                                              }
                                            }}
                                            onKeyDown={(e) => {
                                              if (e.key === "ArrowDown") {
                                                e.preventDefault();
                                                setDateOpen(true);
                                              }
                                            }}
                                          />
                                          <Popover open={dateOpen} onOpenChange={setDateOpen}>
                                            <PopoverTrigger asChild>
                                              <Button
                                                type="button"
                                                variant="ghost"
                                                className="absolute top-1/2 right-2 size-6 -translate-y-1/2"
                                              >
                                                <CalendarIcon className="size-3.5" />
                                                <span className="sr-only">Select date</span>
                                              </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto overflow-hidden p-0" align="end">
                                              <Calendar
                                                mode="single"
                                                selected={field.value}
                                                captionLayout="dropdown"
                                                month={month}
                                                onMonthChange={setMonth}
                                                onSelect={(date) => {
                                                  setFieldValue("publishedDate", date);
                                                  setDateValue(formatDate(date));
                                                  setDateOpen(false);
                                                }}
                                                disabled={(date) => date > new Date()}
                                              />
                                            </PopoverContent>
                                          </Popover>
                                        </div>
                                      </div>
                                      {meta.error && meta.touched && (
                                        <p className="text-sm text-red-500 mt-1">{meta.error}</p>
                                      )}
                                    </div>
                                  );
                                }}
                              </Field>
                            </div>

                            {/* Price Field */}
                            <div className="sm:col-span-3">
                              <Field name="price">
                                {({ field, meta }: FieldProps) => (
                                  <div>
                                    <Label htmlFor="price">Price ($) *</Label>
                                    <div className="mt-2">
                                      <Input
                                        {...field}
                                        id="price"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="19.99"
                                        className={meta.error && meta.touched ? "border-red-500" : ""}
                                      />
                                    </div>
                                    {meta.error && meta.touched && (
                                      <p className="text-sm text-red-500 mt-1">{meta.error}</p>
                                    )}
                                  </div>
                                )}
                              </Field>
                            </div>

                            {/* Format Field */}
                            <div className="sm:col-span-3">
                              <Field name="format">
                                {({ field, meta }: FieldProps) => (
                                  <div>
                                    <Label htmlFor="format">Format *</Label>
                                    <div className="mt-2">
                                      <Select
                                        value={field.value}
                                        onValueChange={(value) => setFieldValue("format", value)}
                                      >
                                        <SelectTrigger className={meta.error && meta.touched ? "border-red-500" : ""}>
                                          <SelectValue placeholder="Select format" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value={BookFormat.HARDCOVER}>Hardcover</SelectItem>
                                          <SelectItem value={BookFormat.PAPERBACK}>Paperback</SelectItem>
                                          <SelectItem value={BookFormat.EBOOK}>eBook</SelectItem>
                                          <SelectItem value={BookFormat.AUDIOBOOK}>Audiobook</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    {meta.error && meta.touched && (
                                      <p className="text-sm text-red-500 mt-1">{meta.error}</p>
                                    )}
                                  </div>
                                )}
                              </Field>
                            </div>

                            {/* Availability Field */}
                            <div className="sm:col-span-3">
                              <Field name="availability">
                                {({ field, meta }: FieldProps) => (
                                  <div>
                                    <Label htmlFor="availability">Availability Status *</Label>
                                    <div className="mt-2">
                                      <RadioGroup 
                                        value={field.value} 
                                        onValueChange={(value) => setFieldValue("availability", value)}
                                        className="flex flex-col gap-3"
                                      >
                                        <div className="flex items-center gap-x-3">
                                          <RadioGroupItem value={BookAvailability.IN_STOCK} id="in-stock" />
                                          <Label htmlFor="in-stock" className="text-sm">
                                            In Stock
                                          </Label>
                                        </div>
                                        <div className="flex items-center gap-x-3">
                                          <RadioGroupItem value={BookAvailability.PRE_ORDER} id="pre-order" />
                                          <Label htmlFor="pre-order" className="text-sm">
                                            Available for Pre-order
                                          </Label>
                                        </div>
                                        <div className="flex items-center gap-x-3">
                                          <RadioGroupItem value={BookAvailability.OUT_OF_STOCK} id="out-of-stock" />
                                          <Label htmlFor="out-of-stock" className="text-sm">
                                            Out of Stock
                                          </Label>
                                        </div>
                                      </RadioGroup>
                                    </div>
                                    {meta.error && meta.touched && (
                                      <p className="text-sm text-red-500 mt-1">{meta.error}</p>
                                    )}
                                  </div>
                                )}
                              </Field>
                            </div>

                            {/* Snapshots Upload */}
                            <div className="col-span-full">
                              <FileUpload
                                label={`Book Snapshots${values.format === BookFormat.EBOOK ? ' (10 required for eBook)' : values.format === BookFormat.PAPERBACK || values.format === BookFormat.HARDCOVER ? ' (5 required for Physical Book)' : ''}`}
                                files={values.snapshots || []}
                                onFilesChange={(files) => setFieldValue("snapshots", files)}
                                error={touched.snapshots && errors.snapshots ? String(errors.snapshots) : undefined}
                                helperText={
                                  values.format === BookFormat.EBOOK 
                                    ? "Upload exactly 10 snapshots for eBook format"
                                    : values.format === BookFormat.PAPERBACK || values.format === BookFormat.HARDCOVER
                                      ? "Upload exactly 5 snapshots for physical book format"
                                      : "Upload book snapshots (optional for audiobook)"
                                }
                                multiple
                                maxFiles={
                                  values.format === BookFormat.EBOOK 
                                    ? 10
                                    : values.format === BookFormat.PAPERBACK || values.format === BookFormat.HARDCOVER
                                      ? 5
                                      : undefined
                                }
                              />
                            </div>

                            {/* Book Files Upload - Only for eBooks */}
                            {values.format === BookFormat.EBOOK && (
                              <div className="col-span-full">
                                <MultiFileUpload
                                  label="eBook Files *"
                                  accept={BOOK_FILE_TYPES}
                                  files={values.bookFiles || []}
                                  onFilesChange={(files) => setFieldValue("bookFiles", files)}
                                  error={touched.bookFiles && errors.bookFiles ? String(errors.bookFiles) : undefined}
                                  helperText="Upload your book files (PDF, EPUB, DOC, etc.). Multiple formats are supported for better compatibility."
                                  multiple
                                  maxFiles={5}
                                  maxSize={50 * 1024 * 1024} // 50MB
                                  required
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section Separator */}
                    <Separator className="my-8" />

                    {/* Availability & Settings Section */}
                    <div className="grid grid-cols-1 gap-x-8 gap-y-8 pt-10 md:grid-cols-3">
                      <div className="px-4 sm:px-0">
                        <h2 className="text-base font-semibold leading-7">
                          Availability & Settings
                        </h2>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                          Configure book availability, categories, and customer interaction settings.
                        </p>
                      </div>

                      <div className="bg-card shadow-sm ring-1 ring-border sm:rounded-xl md:col-span-2">
                        <div className="px-4 py-6 sm:p-8">
                          <div className="max-w-2xl space-y-8">
                            
                            {/* Book Categories */}
                            <fieldset>
                              <legend className="text-sm font-semibold leading-6">
                                Book Categories
                              </legend>
                              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                Select categories that apply to this book for better discoverability.
                              </p>
                              <div className="mt-6 space-y-4">
                                <div className="flex items-center space-x-3">
                                  <Field name="isBestseller">
                                    {({ field }: FieldProps) => (
                                      <div className="flex items-center space-x-3">
                                        <Checkbox
                                          id="bestseller"
                                          checked={field.value}
                                          onCheckedChange={(checked) => setFieldValue("isBestseller", checked)}
                                        />
                                        <div>
                                          <Label htmlFor="bestseller" className="font-medium">
                                            Bestseller
                                          </Label>
                                          <p className="text-sm text-muted-foreground">
                                            Mark this book as a bestseller to highlight it to customers.
                                          </p>
                                        </div>
                                      </div>
                                    )}
                                  </Field>
                                </div>
                                
                                <div className="flex items-center space-x-3">
                                  <Field name="isFeatured">
                                    {({ field }: FieldProps) => (
                                      <div className="flex items-center space-x-3">
                                        <Checkbox
                                          id="featured"
                                          checked={field.value}
                                          onCheckedChange={(checked) => setFieldValue("isFeatured", checked)}
                                        />
                                        <div>
                                          <Label htmlFor="featured" className="font-medium">
                                            Featured
                                          </Label>
                                          <p className="text-sm text-muted-foreground">
                                            Display this book in the featured section on the homepage.
                                          </p>
                                        </div>
                                      </div>
                                    )}
                                  </Field>
                                </div>
                                
                                <div className="flex items-center space-x-3">
                                  <Field name="isNewRelease">
                                    {({ field }: FieldProps) => (
                                      <div className="flex items-center space-x-3">
                                        <Checkbox
                                          id="newRelease"
                                          checked={field.value}
                                          onCheckedChange={(checked) => setFieldValue("isNewRelease", checked)}
                                        />
                                        <div>
                                          <Label htmlFor="newRelease" className="font-medium">
                                            New Release
                                          </Label>
                                          <p className="text-sm text-muted-foreground">
                                            Mark as a new release to appear in the new arrivals section.
                                          </p>
                                        </div>
                                      </div>
                                    )}
                                  </Field>
                                </div>
                              </div>
                            </fieldset>

                            {/* Customer Interaction Settings */}
                            <fieldset>
                              <legend className="text-sm font-semibold leading-6">
                                Customer Interaction Settings
                              </legend>
                              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                Configure how customers can interact with this book.
                              </p>
                              <div className="mt-6 space-y-4">
                                <div className="flex items-center space-x-3 relative">
                                  <Field name="allowReviews">
                                    {({ field }: FieldProps) => (
                                      <div className="flex items-center space-x-3 opacity-60 animate-pulse">
                                        <Checkbox
                                          id="allowReviews"
                                          checked={false}
                                          disabled={true}
                                          className="cursor-not-allowed"
                                        />
                                        <div>
                                          <Label htmlFor="allowReviews" className="font-medium text-muted-foreground cursor-not-allowed">
                                            Allow Customer Reviews 🔒
                                          </Label>
                                          <p className="text-sm text-muted-foreground">
                                            Enable customers to leave reviews and ratings for this book.
                                          </p>
                                          <div className="flex items-center gap-2 mt-1">
                                            <span className="inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20">
                                              Premium Feature
                                            </span>
                                            <p className="text-xs text-orange-600 font-medium">
                                              Unlock forever for one-time fee of ₹7,000 to enable customer reviews
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </Field>
                                </div>
                                
                                <div className="flex items-center space-x-3">
                                  <Field name="allowWishlist">
                                    {({ field }: FieldProps) => (
                                      <div className="flex items-center space-x-3">
                                        <Checkbox
                                          id="allowWishlist"
                                          checked={field.value}
                                          onCheckedChange={(checked) => setFieldValue("allowWishlist", checked)}
                                        />
                                        <div>
                                          <Label htmlFor="allowWishlist" className="font-medium">
                                            Allow Wishlist Addition
                                          </Label>
                                          <p className="text-sm text-muted-foreground">
                                            Allow customers to add this book to their wishlist.
                                          </p>
                                        </div>
                                      </div>
                                    )}
                                  </Field>
                                </div>
                                
                                <div className="flex items-center space-x-3">
                                  <Field name="enableNotifications">
                                    {({ field }: FieldProps) => (
                                      <div className="flex items-center space-x-3">
                                        <Checkbox
                                          id="enableNotifications"
                                          checked={field.value}
                                          onCheckedChange={(checked) => setFieldValue("enableNotifications", checked)}
                                        />
                                        <div>
                                          <Label htmlFor="enableNotifications" className="font-medium">
                                            Enable Stock Notifications
                                          </Label>
                                          <p className="text-sm text-muted-foreground">
                                            Notify customers when this book comes back in stock.
                                          </p>
                                        </div>
                                      </div>
                                    )}
                                  </Field>
                                </div>
                              </div>
                            </fieldset>

                            {/* Visibility Settings */}
                            <fieldset>
                              <legend className="text-sm font-semibold leading-6">
                                Visibility Settings
                              </legend>
                              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                Control where and how this book appears on your store.
                              </p>
                              <div className="mt-6">
                                <Field name="visibility">
                                  {({ field, meta }: FieldProps) => (
                                    <div>
                                      <RadioGroup 
                                        value={field.value || 'public'} 
                                        onValueChange={(value) => setFieldValue("visibility", value)}
                                        className="space-y-3"
                                      >
                                        <div className="flex items-center space-x-3">
                                          <RadioGroupItem value="public" id="visibility-public" />
                                          <div>
                                            <Label htmlFor="visibility-public" className="font-medium">
                                              Public
                                            </Label>
                                            <p className="text-sm text-muted-foreground">
                                              Visible to all customers and appears in search results.
                                            </p>
                                          </div>
                                        </div>
                                        
                                        <div className="flex items-center space-x-3">
                                          <RadioGroupItem value="private" id="visibility-private" />
                                          <div>
                                            <Label htmlFor="visibility-private" className="font-medium">
                                              Private
                                            </Label>
                                            <p className="text-sm text-muted-foreground">
                                              Only visible to administrators and selected users.
                                            </p>
                                          </div>
                                        </div>
                                        
                                        <div className="flex items-center space-x-3">
                                          <RadioGroupItem value="draft" id="visibility-draft" />
                                          <div>
                                            <Label htmlFor="visibility-draft" className="font-medium">
                                              Draft
                                            </Label>
                                            <p className="text-sm text-muted-foreground">
                                              Not visible to customers, saved as draft for later publication.
                                            </p>
                                          </div>
                                        </div>
                                      </RadioGroup>
                                      {meta.error && meta.touched && (
                                        <p className="text-sm text-red-500 mt-1">{meta.error}</p>
                                      )}
                                    </div>
                                  )}
                                </Field>
                              </div>
                            </fieldset>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section Separator */}
                    <Separator className="my-8" />

                    {/* Submit Section */}
                    <div className="flex items-center justify-end gap-x-6 px-4 py-4 sm:px-8 pt-10">
                      <Button type="button" variant="ghost" disabled={isSubmitting}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isSubmitting ? "Creating..." : "Create Book"}
                      </Button>
                    </div>
                  </Form>
                )}
              </Formik>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}