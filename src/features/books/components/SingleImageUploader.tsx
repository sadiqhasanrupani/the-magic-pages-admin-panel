"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Loader2, UploadCloud, X, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useBookMutation } from "../hooks/useBooks";

interface SingleImageUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  disabled?: boolean;
}

export function SingleImageUploader({
  value,
  onChange,
  disabled,
}: SingleImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const { uploadFile } = useBookMutation();

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size too large (max 5MB)");
        return;
      }

      try {
        setIsUploading(true);
        const { url } = await uploadFile(file);
        onChange(url);
        toast.success("Image uploaded successfully");
      } catch (error) {
        toast.error("Failed to upload image");
        console.error("Upload error:", error);
      } finally {
        setIsUploading(false);
      }
    },
    [onChange, uploadFile]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".webp"],
    },
    maxFiles: 1,
    disabled: disabled || isUploading,
    multiple: false,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "relative flex flex-col items-center justify-center w-full aspect-[2/3] border-2 border-dashed rounded-lg transition-colors cursor-pointer overflow-hidden bg-muted/10 hover:bg-muted/20",
        isDragActive && "border-primary bg-primary/5",
        disabled && "opacity-50 cursor-not-allowed",
        // If image exists, remove border to show preview cleanly
        value && !isDragActive && "border-none"
      )}
    >
      <input {...getInputProps()} />

      {/* Loading Overlay */}
      {isUploading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/50 backdrop-blur-sm">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Image Preview */}
      {value ? (
        <div className="relative w-full h-full group">
          <Image
            src={value}
            alt="Cover Image"
            fill
            className="object-cover"
          />
          {/* Hover Overlay for Replace hint */}
          {!disabled && !isUploading && (
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
              <UploadCloud className="h-8 w-8 mb-2" />
              <p className="text-sm font-medium">Drop to Replace</p>
            </div>
          )}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center text-center p-4">
          <div className="p-3 bg-background rounded-full shadow-sm mb-3">
            <ImageIcon className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">Upload Cover</p>
          <p className="text-xs text-muted-foreground mt-1">
            Drag & drop or click
          </p>
        </div>
      )}
    </div>
  );
}
