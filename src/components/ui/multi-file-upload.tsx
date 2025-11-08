"use client";

import React, { useState, useCallback } from 'react';
import { Upload, X, File, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export interface UploadFile extends File {
  id: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

interface MultiFileUploadProps {
  label: string;
  accept?: string[];
  multiple?: boolean;
  maxFiles?: number;
  maxSize?: number; // in bytes
  onFilesChange: (files: File[]) => void;
  files: File[];
  error?: string;
  helperText?: string;
  required?: boolean;
  className?: string;
}

// Supported file types for book files
export const BOOK_FILE_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/msword', // .doc
  'application/vnd.ms-excel', // .xls
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/epub+zip', // .epub
  'text/plain', // .txt
  'application/rtf', // .rtf
  'application/vnd.oasis.opendocument.text', // .odt
];

export const BOOK_FILE_EXTENSIONS = [
  '.pdf', '.docx', '.doc', '.xls', '.xlsx', '.epub', '.txt', '.rtf', '.odt'
];

export function MultiFileUpload({
  label,
  accept = [],
  multiple = true,
  maxFiles = 10,
  maxSize = 50 * 1024 * 1024, // 50MB default
  onFilesChange,
  files,
  error,
  helperText,
  required = false,
  className,
}: MultiFileUploadProps) {
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  const createUploadFile = (file: File): UploadFile => {
    const uploadFile = file as UploadFile;
    uploadFile.id = `${file.name}-${Date.now()}`;
    uploadFile.progress = 0;
    uploadFile.status = 'pending';
    return uploadFile;
  };

  const validateFile = (file: File): string | null => {
    if (maxSize && file.size > maxSize) {
      return `File size exceeds ${(maxSize / (1024 * 1024)).toFixed(1)}MB`;
    }
    
    if (accept.length > 0 && !accept.includes(file.type)) {
      const extension = '.' + file.name.split('.').pop()?.toLowerCase();
      const acceptsExtension = BOOK_FILE_EXTENSIONS.some(ext => 
        ext.toLowerCase() === extension
      );
      if (!acceptsExtension) {
        return 'File type not supported';
      }
    }
    
    return null;
  };

  const handleFiles = useCallback((newFiles: File[]) => {
    const validFiles: UploadFile[] = [];
    const errors: string[] = [];

    newFiles.forEach(file => {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push(createUploadFile(file));
      }
    });

    if (errors.length > 0) {
      toast.error(`Upload errors: ${errors.join(', ')}`);
      return;
    }

    const currentFiles = multiple ? [...uploadFiles, ...validFiles] : validFiles;
    const limitedFiles = maxFiles ? currentFiles.slice(0, maxFiles) : currentFiles;
    
    setUploadFiles(limitedFiles);
    onFilesChange(limitedFiles);
  }, [uploadFiles, multiple, maxFiles, onFilesChange]);

  const removeFile = (fileId: string) => {
    const updatedFiles = uploadFiles.filter(f => f.id !== fileId);
    setUploadFiles(updatedFiles);
    onFilesChange(updatedFiles);
  };

  const simulateUpload = async (fileId: string) => {
    const updateFileProgress = (progress: number, status: UploadFile['status'], error?: string) => {
      setUploadFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, progress, status, error } : f
      ));
    };

    updateFileProgress(0, 'uploading');
    
    // Simulate upload progress
    for (let progress = 0; progress <= 100; progress += 10) {
      await new Promise(resolve => setTimeout(resolve, 100));
      updateFileProgress(progress, 'uploading');
    }
    
    updateFileProgress(100, 'success');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    handleFiles(selectedFiles);
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    return <File className="h-8 w-8 text-muted-foreground" />;
  };

  const getStatusIcon = (status: UploadFile['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'uploading':
        return <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />;
      default:
        return null;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={cn("space-y-4", className)}>
      <Label className={`block text-sm font-medium ${required ? "after:content-['*'] after:text-red-500" : ""}`}>
        {label}
      </Label>
      
      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
          isDragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
          error ? "border-red-500" : ""
        )}
      >
        <input
          type="file"
          multiple={multiple}
          accept={accept.join(',')}
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <div className="text-sm text-muted-foreground">
          <span className="font-medium text-primary">Click to upload</span> or drag and drop
          <p className="mt-1">
            {accept.length > 0 
              ? `Supported: ${BOOK_FILE_EXTENSIONS.join(', ')}`
              : 'Any file type'
            } up to {(maxSize / (1024 * 1024)).toFixed(0)}MB
          </p>
          {multiple && maxFiles && (
            <p className="text-xs mt-1">Maximum {maxFiles} files</p>
          )}
        </div>
      </div>

      {/* File List */}
      {uploadFiles.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium">
            {uploadFiles.length} file{uploadFiles.length > 1 ? 's' : ''} selected:
          </p>
          
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {uploadFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border"
              >
                <div className="shrink-0">
                  {getFileIcon(file.name)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(file.status)}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
                        onClick={() => removeFile(file.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                    <span>{formatFileSize(file.size)}</span>
                    {file.status === 'uploading' && <span>{file.progress}%</span>}
                    {file.status === 'error' && (
                      <span className="text-red-500">{file.error}</span>
                    )}
                  </div>
                  
                  {file.status === 'uploading' && (
                    <Progress value={file.progress} className="h-1" />
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {/* Upload All Button */}
          {uploadFiles.some(f => f.status === 'pending') && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                uploadFiles
                  .filter(f => f.status === 'pending')
                  .forEach(f => simulateUpload(f.id));
              }}
              className="w-full"
            >
              Upload All Files
            </Button>
          )}
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

// We need to import toast
import { toast } from "sonner";