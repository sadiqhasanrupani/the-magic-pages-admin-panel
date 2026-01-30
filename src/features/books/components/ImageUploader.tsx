"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, Loader2, FileIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { uploadFile } from "../api/books.api";

interface ImageUploaderProps {
  value?: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
}

interface UploadingFile {
  id: string;
  file: File;
  status: "uploading" | "error" | "success";
}

export function ImageUploader({ value = [], onChange, disabled }: ImageUploaderProps) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    // Generate temp IDs for immediate UI feedback
    const newUploads: UploadingFile[] = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      status: "uploading"
    }));

    setUploadingFiles(prev => [...prev, ...newUploads]);

    const uploadPromises = newUploads.map(async (uploadItem) => {
      try {
        const { url } = await uploadFile(uploadItem.file);

        // Remove from uploading list
        setUploadingFiles(prev => prev.filter(item => item.id !== uploadItem.id));

        return url;
      } catch (error) {
        console.error("Upload failed", error);
        toast.error(`Failed to upload ${uploadItem.file.name}`);

        setUploadingFiles(prev => prev.map(item =>
          item.id === uploadItem.id ? { ...item, status: "error" } : item
        ));

        return null;
      }
    });

    const results = await Promise.all(uploadPromises);
    const successUrls = results.filter((url): url is string => url !== null);

    if (successUrls.length > 0) {
      onChange([...value, ...successUrls]);
    }
  }, [value, onChange]);

  const removeImage = (urlToRemove: string) => {
    onChange(value.filter(url => url !== urlToRemove));
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    },
    disabled: disabled || uploadingFiles.length > 0
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 cursor-pointer transition-colors flex flex-col items-center justify-center gap-2 text-center",
          isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <input {...getInputProps()} />
        <Upload className="h-8 w-8 text-muted-foreground" />
        <div className="text-sm text-muted-foreground">
          {isDragActive ? (
            <p>Drop the files here...</p>
          ) : (
            <p>Drag & drop images here, or click to select files</p>
          )}
        </div>
      </div>

      {(value.length > 0 || uploadingFiles.length > 0) && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Existing Images */}
          {value.map((url, index) => (
            <div key={`${url}-${index}`} className="relative group aspect-square rounded-md border overflow-hidden bg-muted">
              {/* Note: Using standard img for now to avoid domain config issues, can switch to next/image later */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt="Uploaded resource"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeImage(url)}
                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}

          {/* Uploading Files */}
          {uploadingFiles.map((item) => (
            <div key={item.id} className="relative aspect-square rounded-md border flex items-center justify-center bg-muted">
              <div className="flex flex-col items-center gap-2">
                {item.status === "uploading" ? (
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                ) : (
                  <FileIcon className="h-8 w-8 text-destructive" />
                )}
                <span className="text-xs text-muted-foreground truncate w-20 text-center">
                  {item.file.name}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
