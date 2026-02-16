// ============================================================================
// EJLOG WMS - FileUpload Component
// Drag-and-drop file upload con preview per immagini
// ============================================================================

import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, File, Image as ImageIcon } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

export interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in bytes
  maxFiles?: number;
  showPreview?: boolean;
  disabled?: boolean;
  label?: string;
  helpText?: string;
  error?: string;
  className?: string;
  'data-testid'?: string;
}

interface PreviewFile {
  file: File;
  preview: string;
}

/**
 * FileUpload Component
 *
 * Componente per upload file con drag-and-drop:
 * - Drag & drop
 * - Click to select
 * - Preview per immagini
 * - Validazione dimensione file
 * - Multiple files
 * - Rimozione file selezionati
 *
 * @example
 * ```tsx
 * <FileUpload
 *   label="Upload Product Image"
 *   accept="image/*"
 *   maxSize={5 * 1024 * 1024} // 5MB
 *   showPreview
 *   onFilesSelected={(files) => console.log(files)}
 * />
 * ```
 */
export default function FileUpload({
  onFilesSelected,
  accept = '*',
  multiple = false,
  maxSize = 10 * 1024 * 1024, // 10MB default
  maxFiles = 5,
  showPreview = true,
  disabled = false,
  label,
  helpText,
  error,
  className,
  'data-testid': dataTestId,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<PreviewFile[]>([]);
  const [validationError, setValidationError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Validate file
   */
  const validateFile = (file: File): string | null => {
    // Check size
    if (file.size > maxSize) {
      const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
      return `File "${file.name}" is too large. Max size: ${maxSizeMB}MB`;
    }

    // Check file type if accept is specified
    if (accept !== '*') {
      const acceptTypes = accept.split(',').map((t) => t.trim());
      const fileType = file.type;
      const fileExt = `.${file.name.split('.').pop()}`;

      const isValid = acceptTypes.some((acceptType) => {
        if (acceptType === fileType) return true;
        if (acceptType.endsWith('/*') && fileType.startsWith(acceptType.replace('/*', ''))) return true;
        if (acceptType === fileExt) return true;
        return false;
      });

      if (!isValid) {
        return `File "${file.name}" has invalid type. Accepted: ${accept}`;
      }
    }

    return null;
  };

  /**
   * Process selected files
   */
  const processFiles = useCallback(
    (files: FileList | File[]) => {
      const fileArray = Array.from(files);

      // Check max files
      if (!multiple && fileArray.length > 1) {
        setValidationError('Only one file can be selected');
        return;
      }

      if (selectedFiles.length + fileArray.length > maxFiles) {
        setValidationError(`Maximum ${maxFiles} files allowed`);
        return;
      }

      // Validate each file
      for (const file of fileArray) {
        const error = validateFile(file);
        if (error) {
          setValidationError(error);
          return;
        }
      }

      setValidationError('');

      // Create preview for images
      const newFiles: PreviewFile[] = fileArray.map((file) => {
        const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : '';
        return { file, preview };
      });

      const updatedFiles = multiple ? [...selectedFiles, ...newFiles] : newFiles;
      setSelectedFiles(updatedFiles);

      // Notify parent
      onFilesSelected(updatedFiles.map((f) => f.file));
    },
    [multiple, maxFiles, selectedFiles, onFilesSelected, maxSize, accept]
  );

  /**
   * Handle file input change
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  /**
   * Handle drag over
   */
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  /**
   * Handle drag leave
   */
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  /**
   * Handle drop
   */
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
  };

  /**
   * Remove file
   */
  const handleRemoveFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    onFilesSelected(newFiles.map((f) => f.file));

    // Revoke preview URL to free memory
    if (selectedFiles[index].preview) {
      URL.revokeObjectURL(selectedFiles[index].preview);
    }
  };

  /**
   * Open file picker
   */
  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  /**
   * Format file size
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  // Cleanup preview URLs on unmount
  React.useEffect(() => {
    return () => {
      selectedFiles.forEach((file) => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, [selectedFiles]);

  const displayError = error || validationError;

  return (
    <div className={twMerge('space-y-3', className)} data-testid={dataTestId}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      {/* Drop Zone */}
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={twMerge(
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
          isDragging && 'border-ferrRed bg-red-50',
          !isDragging && !disabled && 'border-gray-300 hover:border-ferrRed hover:bg-gray-50',
          disabled && 'border-gray-200 bg-gray-100 cursor-not-allowed',
          displayError && 'border-red-500 bg-red-50'
        )}
        data-testid={`${dataTestId}-dropzone`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileChange}
          disabled={disabled}
          className="hidden"
          data-testid={`${dataTestId}-input`}
        />

        <div className="flex flex-col items-center space-y-2">
          <Upload
            className={twMerge(
              'w-12 h-12',
              isDragging ? 'text-ferrRed' : 'text-gray-400',
              disabled && 'text-gray-300'
            )}
          />
          <div>
            <p className={twMerge('text-sm', disabled ? 'text-gray-400' : 'text-gray-700')}>
              <span className="font-semibold text-ferrRed">Click to upload</span> or drag and drop
            </p>
            {helpText && (
              <p className="text-xs text-gray-500 mt-1">{helpText}</p>
            )}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {displayError && (
        <p className="text-sm text-red-600" role="alert" data-testid={`${dataTestId}-error`}>
          {displayError}
        </p>
      )}

      {/* Selected Files Preview */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2" data-testid={`${dataTestId}-preview`}>
          <p className="text-sm font-medium text-gray-700">Selected Files:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {selectedFiles.map((fileObj, index) => (
              <div
                key={index}
                className="relative border border-gray-200 rounded-lg p-3 bg-white"
                data-testid={`${dataTestId}-file-${index}`}
              >
                {/* Remove Button */}
                <button
                  onClick={() => handleRemoveFile(index)}
                  className="absolute top-1 right-1 p-1 bg-white rounded-full shadow-md hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors"
                  data-testid={`${dataTestId}-remove-${index}`}
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Preview */}
                {showPreview && fileObj.preview ? (
                  <div className="aspect-square rounded-md overflow-hidden mb-2 bg-gray-100">
                    <img
                      src={fileObj.preview}
                      alt={fileObj.file.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="aspect-square rounded-md overflow-hidden mb-2 bg-gray-100 flex items-center justify-center">
                    {fileObj.file.type.startsWith('image/') ? (
                      <ImageIcon className="w-12 h-12 text-gray-400" />
                    ) : (
                      <File className="w-12 h-12 text-gray-400" />
                    )}
                  </div>
                )}

                {/* File Info */}
                <div className="text-xs">
                  <p className="font-medium text-gray-900 truncate" title={fileObj.file.name}>
                    {fileObj.file.name}
                  </p>
                  <p className="text-gray-500">{formatFileSize(fileObj.file.size)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
