"use client";

import { useCallback, useState } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import {
  FileText,
  Loader2,
  RefreshCw,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { uploadFile } from "../api/books.api";
import {
  DIGITAL_MATERIAL_ACCEPT,
  DIGITAL_MATERIAL_EXTENSIONS,
  MAX_DIGITAL_MATERIAL_SIZE,
  digitalMaterialFileName,
  formatFileSize,
} from "../utils/book-format";

interface DigitalMaterialUploaderProps {
  /** The stored deliverable URL, or empty/undefined when nothing is attached. */
  value?: string;
  onChange: (url: string) => void;
  disabled?: boolean;
}

/**
 * Uploader for a digital variant's deliverable — the ebook/audiobook file the
 * buyer is emailed a secure download link for after purchase.
 *
 * Deliberately shaped exactly like {@link SingleImageUploader}: same
 * `value: string | undefined` / `onChange(url)` contract, same two-step flow
 * (`POST /admin/upload` returns `{ url }`, the URL then travels in the book's
 * JSON body). Nothing new is invented on the wire — a deliverable is attached
 * the same way a cover is.
 *
 * The one deliberate divergence from the image uploaders is that the filled
 * state shows a filename card rather than a clickable preview. Non-image
 * uploads are written with a private ACL by the storage layer, so the returned
 * URL is not fetchable from the browser — a "preview" link here would be a
 * guaranteed 403. The admin gets the filename, an explicit "attached" state, and
 * replace/remove controls instead.
 */
export function DigitalMaterialUploader({
  value,
  onChange,
  disabled,
}: DigitalMaterialUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [pendingName, setPendingName] = useState<string | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      if (file.size > MAX_DIGITAL_MATERIAL_SIZE) {
        toast.error(
          `File is too large (${formatFileSize(file.size)}). Maximum is ${formatFileSize(
            MAX_DIGITAL_MATERIAL_SIZE,
          )}.`,
        );
        return;
      }

      try {
        setIsUploading(true);
        setPendingName(file.name);

        const { url } = await uploadFile(file);
        onChange(url);
        toast.success(`"${file.name}" attached`);
      } catch (error) {
        toast.error(`Failed to upload "${file.name}"`);
        console.error("Digital material upload error:", error);
      } finally {
        setIsUploading(false);
        setPendingName(null);
      }
    },
    [onChange],
  );

  const onDropRejected = useCallback((rejections: FileRejection[]) => {
    const reason = rejections[0]?.errors[0];
    toast.error(
      reason?.code === "file-invalid-type"
        ? `Unsupported file type. Accepted: ${DIGITAL_MATERIAL_EXTENSIONS.join(", ")}`
        : (reason?.message ?? "That file could not be accepted"),
    );
  }, []);

  const { getRootProps, getInputProps, open, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    accept: DIGITAL_MATERIAL_ACCEPT,
    maxFiles: 1,
    multiple: false,
    disabled: disabled || isUploading,
    // The filled state replaces the dropzone with a card whose buttons drive the
    // picker explicitly, so the root should not also open it on every click.
    noClick: !!value,
    noKeyboard: !!value,
  });

  const hasFile = !!value && !isUploading;

  // react-dropzone puts `role="presentation"` plus the keyboard handlers on the
  // root, which leaves the empty-state dropzone focusable but unnamed. In that
  // state it really is the control, so give it button semantics and a label;
  // once a file is attached the named Replace/Remove buttons take over and the
  // root goes back to being a plain container.
  const rootProps = hasFile
    ? getRootProps()
    : getRootProps({ role: "button", "aria-label": "Upload deliverable file" });

  return (
    <div
      {...rootProps}
      className={cn(
        "rounded-lg border-2 border-dashed transition-colors",
        isDragActive && "border-primary bg-primary/5",
        hasFile && !isDragActive && "border-solid bg-muted/20",
        disabled && "opacity-50",
      )}
    >
      <input {...getInputProps()} />

      {isUploading ? (
        <div className="flex items-center gap-3 p-4">
          <Loader2 className="h-5 w-5 shrink-0 animate-spin text-primary" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{pendingName}</p>
            <p className="text-xs text-muted-foreground">Uploading…</p>
          </div>
        </div>
      ) : hasFile ? (
        <div className="flex items-center gap-3 p-3">
          <div className="rounded-md bg-background p-2 shadow-sm">
            <FileText className="h-5 w-5 text-muted-foreground" />
          </div>

          <div className="min-w-0 flex-1">
            <p
              className="truncate text-sm font-medium"
              title={digitalMaterialFileName(value)}
            >
              {digitalMaterialFileName(value) || "Attached file"}
            </p>
            <p className="text-xs text-muted-foreground">
              Current file uploaded — buyers receive this as a secure download
              link.
            </p>
          </div>

          {!disabled && (
            <div className="flex shrink-0 items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={open}
                aria-label="Replace deliverable file"
              >
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                Replace
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-destructive hover:bg-destructive/10"
                onClick={() => onChange("")}
                aria-label="Remove deliverable file"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div
          className={cn(
            "flex flex-col items-center justify-center gap-2 p-6 text-center",
            !disabled && "cursor-pointer",
          )}
        >
          <UploadCloud className="h-7 w-7 text-muted-foreground" />
          <p className="text-sm font-medium">
            {isDragActive ? "Drop the file here…" : "Upload deliverable file"}
          </p>
          <p className="text-xs text-muted-foreground">
            {DIGITAL_MATERIAL_EXTENSIONS.join(", ")} · up to{" "}
            {formatFileSize(MAX_DIGITAL_MATERIAL_SIZE)}
          </p>
        </div>
      )}
    </div>
  );
}
