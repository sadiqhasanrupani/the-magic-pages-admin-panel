"use client";

import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { IconPlus, IconTrash, IconLoader2, IconArrowLeft } from "@tabler/icons-react";

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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import {
  createInvoiceSchema,
  BOOK_FORMAT_OPTIONS,
  DEFAULT_INVOICE_ITEM,
  type CreateInvoiceFormInput,
  type CreateInvoiceFormValues,
} from "../schemas/invoice.schema";
import { useCreateInvoice } from "../hooks/useInvoices";
import type { CreateInvoicePayload } from "../types/invoices.types";

// ── Helpers ────────────────────────────────────────────────────────────────

// Today's date in YYYY-MM-DD for input[type="date"] default values
const todayISO = () => new Date().toISOString().slice(0, 10);

const DEFAULT_VALUES: CreateInvoiceFormInput = {
  orderId:      0,
  items:        [DEFAULT_INVOICE_ITEM],
  invoiceDate:  todayISO(),
  dueDate:      undefined,
  currency:     "INR",
  taxRate:      undefined,
  discountAmount: undefined,
  shippingAddress: undefined,
  billingAddress:  undefined,
  gatewayTransactionRef: undefined,
  notes:        undefined,
};

// ── Sub-components for address field groups ────────────────────────────────

interface AddressFieldsProps {
  prefix: "shippingAddress" | "billingAddress";
  form: ReturnType<
    typeof useForm<CreateInvoiceFormInput, unknown, CreateInvoiceFormValues>
  >;
}

function AddressFields({ prefix, form }: AddressFieldsProps) {
  const isShipping = prefix === "shippingAddress";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Full name — full width */}
      <div className="md:col-span-2">
        <FormField
          control={form.control}
          name={`${prefix}.fullName`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="Ayaan Khan" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="md:col-span-2">
        <FormField
          control={form.control}
          name={`${prefix}.addressLine1`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address Line 1</FormLabel>
              <FormControl>
                <Input placeholder="12, MG Road" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="md:col-span-2">
        <FormField
          control={form.control}
          name={`${prefix}.addressLine2`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address Line 2 (optional)</FormLabel>
              <FormControl>
                <Input placeholder="Apartment 4B" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name={`${prefix}.city`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>City</FormLabel>
            <FormControl>
              <Input placeholder="Mumbai" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name={`${prefix}.state`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>State</FormLabel>
            <FormControl>
              <Input placeholder="Maharashtra" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name={`${prefix}.postalCode`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Postal Code</FormLabel>
            <FormControl>
              <Input placeholder="400001" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name={`${prefix}.country`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Country</FormLabel>
            <FormControl>
              <Input placeholder="India" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Phone (shipping) or email (billing) */}
      {isShipping ? (
        <FormField
          control={form.control}
          name="shippingAddress.phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone (optional)</FormLabel>
              <FormControl>
                <Input placeholder="+91-9876543210" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      ) : (
        <FormField
          control={form.control}
          name="billingAddress.email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email (optional)</FormLabel>
              <FormControl>
                <Input type="email" placeholder="buyer@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  );
}

// ── Main form component ────────────────────────────────────────────────────

export function InvoiceForm() {
  const router = useRouter();
  const { mutate: createInvoice, isPending } = useCreateInvoice();

  const form = useForm<CreateInvoiceFormInput, unknown, CreateInvoiceFormValues>({
    resolver: zodResolver(createInvoiceSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // ── Reactive: watch items to decide whether to show shipping address ──────
  // Using watch() here is intentional — we want live re-renders as the user
  // selects itemType so the shipping section appears/disappears immediately.
  const watchedItems = form.watch("items");
  const showShippingAddress = watchedItems.some(
    (item) => item.itemType === "TANGIBLE",
  );

  // ── Submit handler ────────────────────────────────────────────────────────

  const onSubmit = (values: CreateInvoiceFormValues) => {
    // Strip empty optional strings so the backend receives clean data
    const payload: CreateInvoicePayload = {
      orderId:     values.orderId,
      invoiceDate: values.invoiceDate,
      ...(values.dueDate        ? { dueDate: values.dueDate }               : {}),
      ...(values.currency       ? { currency: values.currency }             : {}),
      ...(values.taxRate        !== undefined ? { taxRate: values.taxRate } : {}),
      ...(values.discountAmount !== undefined ? { discountAmount: values.discountAmount } : {}),
      ...(showShippingAddress && values.shippingAddress
        ? { shippingAddress: values.shippingAddress }
        : {}),
      ...(values.billingAddress
        ? { billingAddress: values.billingAddress }
        : {}),
      ...(values.gatewayTransactionRef
        ? { gatewayTransactionRef: values.gatewayTransactionRef }
        : {}),
      ...(values.notes ? { notes: values.notes } : {}),
      items: values.items.map((item) => ({
        itemType:  item.itemType,
        title:     item.title,
        format:    item.format,
        quantity:  item.quantity,
        unitPrice: item.unitPrice,
        ...(item.orderItemId         ? { orderItemId: item.orderItemId }                 : {}),
        ...(item.bookFormatVariantId ? { bookFormatVariantId: item.bookFormatVariantId } : {}),
        ...(item.sku                 ? { sku: item.sku }                                 : {}),
        ...(item.fileDeliveryUrl     ? { fileDeliveryUrl: item.fileDeliveryUrl }         : {}),
        ...(item.taxRate    !== undefined ? { taxRate: item.taxRate }           : {}),
        ...(item.discountAmount !== undefined ? { discountAmount: item.discountAmount } : {}),
      })),
    };

    createInvoice(payload, {
      onSuccess: () => router.push("/invoices"),
    });
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

        {/* ── 1. Invoice Details ───────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Details</CardTitle>
            <CardDescription>Basic information for this invoice.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="orderId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Order ID</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      placeholder="42"
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseInt(e.target.value, 10) || 0)
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    The backend Order this invoice is raised against.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Currency</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="INR" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="INR">INR — Indian Rupee</SelectItem>
                      <SelectItem value="USD">USD — US Dollar</SelectItem>
                      <SelectItem value="GBP">GBP — British Pound</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="invoiceDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Invoice Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Due Date (optional)</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormDescription>
                    Leave blank for digital-only invoices.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* ── 2. Line Items ────────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>Line Items</CardTitle>
            <CardDescription>
              Add at least one item. Set type to{" "}
              <strong>Tangible</strong> for physical products — the
              shipping address section will appear automatically.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => {
              const itemType = form.watch(`items.${index}.itemType`);
              const isTangible = itemType === "TANGIBLE";

              return (
                <div
                  key={field.id}
                  className="rounded-md border p-4 space-y-4 relative"
                >
                  {/* Remove button */}
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute top-3 right-3 h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => remove(index)}
                    >
                      <IconTrash className="h-4 w-4" />
                      <span className="sr-only">Remove item</span>
                    </Button>
                  )}

                  <p className="text-sm font-semibold text-muted-foreground">
                    Item {index + 1}
                  </p>

                  {/* Row 1: itemType + format + title */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name={`items.${index}.itemType`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="TANGIBLE">
                                📦 Tangible (physical)
                              </SelectItem>
                              <SelectItem value="INTANGIBLE">
                                📄 Intangible (digital)
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`items.${index}.format`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Format</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {BOOK_FORMAT_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`items.${index}.title`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Product Title</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="The Magical Forest — Hardcover"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Row 2: quantity + unitPrice + taxRate + discountAmount */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <FormField
                      control={form.control}
                      name={`items.${index}.quantity`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Qty</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              {...field}
                              onChange={(e) =>
                                field.onChange(
                                  parseInt(e.target.value, 10) || 1,
                                )
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`items.${index}.unitPrice`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unit Price</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              step={0.01}
                              placeholder="499.00"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseFloat(e.target.value) || 0)
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`items.${index}.taxRate`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tax Rate %</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              max={100}
                              step={0.01}
                              placeholder="18"
                              {...field}
                              value={field.value ?? ""}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value === ""
                                    ? undefined
                                    : parseFloat(e.target.value),
                                )
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`items.${index}.discountAmount`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Discount</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              step={0.01}
                              placeholder="0.00"
                              {...field}
                              value={field.value ?? ""}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value === ""
                                    ? undefined
                                    : parseFloat(e.target.value),
                                )
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Conditional: SKU for tangible / delivery URL for digital */}
                  {isTangible ? (
                    <FormField
                      control={form.control}
                      name={`items.${index}.sku`}
                      render={({ field }) => (
                        <FormItem className="max-w-xs">
                          <FormLabel>ISBN / SKU</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="978-3-16-148410-0"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Physical book ISBN or warehouse SKU.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ) : (
                    <FormField
                      control={form.control}
                      name={`items.${index}.fileDeliveryUrl`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Delivery URL (optional)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="https://cdn.example.com/books/file.pdf"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Signed download link for the digital asset.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              );
            })}

            {/* Add item button */}
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => append({ ...DEFAULT_INVOICE_ITEM })}
            >
              <IconPlus className="mr-2 h-4 w-4" />
              Add Line Item
            </Button>

            {/* Field-array level error (e.g. min 1 item) */}
            {form.formState.errors.items?.root && (
              <p className="text-sm font-medium text-destructive">
                {form.formState.errors.items.root.message}
              </p>
            )}
          </CardContent>
        </Card>

        {/* ── 3. Shipping Address (conditionally rendered) ─────────────────── */}
        {showShippingAddress && (
          <Card className="border-orange-200 dark:border-orange-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📦 Shipping Address
                <span className="text-xs font-normal text-muted-foreground bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 px-2 py-0.5 rounded-full">
                  Required — tangible items detected
                </span>
              </CardTitle>
              <CardDescription>
                Where the physical items will be shipped. This section
                appears because at least one line item is{" "}
                <strong>Tangible</strong>.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* superRefine error surfaces here */}
              {form.formState.errors.shippingAddress?.message && (
                <p className="text-sm font-medium text-destructive mb-4">
                  {form.formState.errors.shippingAddress.message}
                </p>
              )}
              <AddressFields prefix="shippingAddress" form={form} />
            </CardContent>
          </Card>
        )}

        {/* ── 4. Billing Address ────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>Billing Address (optional)</CardTitle>
            <CardDescription>
              Stored on the invoice for legal and accounting purposes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AddressFields prefix="billingAddress" form={form} />
          </CardContent>
        </Card>

        {/* ── 5. Invoice-level Adjustments & Notes ─────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>Adjustments & Notes</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="taxRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Invoice-level Tax Rate % (optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step={0.01}
                      placeholder="18"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === ""
                            ? undefined
                            : parseFloat(e.target.value),
                        )
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    Overrides per-item tax rates. Applied to the total
                    subtotal.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="discountAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Invoice-level Discount (optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      placeholder="0.00"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === ""
                            ? undefined
                            : parseFloat(e.target.value),
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="gatewayTransactionRef"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Razorpay Reference (optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="pay_QwErTy12345"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Razorpay payment_id or order_id for reconciliation.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="md:col-span-2">
              <Separator className="my-2" />
            </div>

            <div className="md:col-span-2">
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder="Any additional information for this invoice…"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* ── Submit row ────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.back()}
            disabled={isPending}
          >
            <IconArrowLeft className="mr-2 h-4 w-4" />
            Cancel
          </Button>

          <Button type="submit" disabled={isPending}>
            {isPending && (
              <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {isPending ? "Creating…" : "Create Invoice"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
