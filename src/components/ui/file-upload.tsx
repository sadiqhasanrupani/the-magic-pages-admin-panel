"use client";

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { ImageIcon, X, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Image from 'next/image';

interface FileUploadProps {
  label: string;
  accept?: Record<string, string[]>;
  multiple?: boolean;
  maxFiles?: number;
  maxSize?: number;
  onFilesChange: (files: File[]) => void;
  files: File[];
  error?: string;
  helperText?: string;
  required?: boolean;
}

export function FileUpload({
  label,
  accept = { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
  multiple = false,
  maxFiles = 1,
  maxSize = 10 * 1024 * 1024, // 10MB
  onFilesChange,
  files,
  error,
  helperText,
  required = false,
}: FileUploadProps) {
  const [previews, setPreviews] = useState<string[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = multiple ? [...files, ...acceptedFiles] : acceptedFiles;
    
    // Limit files if maxFiles is set
    const limitedFiles = maxFiles ? newFiles.slice(0, maxFiles) : newFiles;
    
    onFilesChange(limitedFiles);

    // Generate previews
    const newPreviews = limitedFiles.map((file) => URL.createObjectURL(file));
    setPreviews(newPreviews);
  }, [files, multiple, maxFiles, onFilesChange]);

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    
    onFilesChange(newFiles);
    setPreviews(newPreviews);
    
    // Revoke URL to prevent memory leaks
    if (previews[index]) {
      URL.revokeObjectURL(previews[index]);
    }
  };

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept,
    multiple,
    maxFiles: maxFiles - files.length,
    maxSize,
  });

  return (
    <div className="space-y-3">
      <Label className={`block text-sm font-medium ${required ? "after:content-['*'] after:text-red-500" : ""}`}>
        {label}
      </Label>
      
      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-6 cursor-pointer transition-colors
          ${isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
          ${error ? 'border-red-500' : ''}
        `}
      >
        <input {...getInputProps()} />
        <div className="text-center">
          <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <div className="text-sm text-muted-foreground">
            {isDragActive ? (
              <p>Drop the files here...</p>
            ) : (
              <div>
                <span className="font-medium text-primary">Click to upload</span> or drag and drop
                <p className="mt-1">PNG, JPG, WEBP up to {(maxSize / (1024 * 1024)).toFixed(0)}MB</p>
                {multiple && maxFiles && (
                  <p className="text-xs">Maximum {maxFiles} files</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* File Rejections */}
      {fileRejections.length > 0 && (
        <div className="text-sm text-red-500">
          {fileRejections.map(({ file, errors }) => (
            <div key={file.name}>
              {errors.map((error) => (
                <p key={error.code}>{error.message}</p>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Preview */}
      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Selected files:</p>
          <div className={multiple ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" : ""}>
            {files.map((file, index) => (
              <div key={`${file.name}-${index}`} className="relative group">
                <div className="relative aspect-square w-full max-w-[120px] border rounded-lg overflow-hidden bg-muted">
                  {previews[index] && (
                    <Image
                      src={previews[index]}
                      alt={file.name}
                      fill
                      className="object-cover"
                    />
                  )}
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeFile(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
                <p className="text-xs text-muted-foreground mt-1 truncate max-w-[120px]">
                  {file.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Helper Text */}
      {helperText && !error && (
        <p className="text-sm text-muted-foreground">{helperText}</p>
      )}

      {/* Error */}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}