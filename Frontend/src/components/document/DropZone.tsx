'use client';

import React, { useCallback, useRef, useState } from 'react';
import { CloudUpload, FolderOpen } from 'lucide-react';
import { ACCEPT_FILE_INPUT, MAX_FILES_PER_UPLOAD } from '@/constants';
import { validateFile, generateClientId } from '@/lib/file-utils';
import type { SelectedFile } from '@/types';

interface DropZoneProps {
  onFilesSelected: (files: SelectedFile[]) => void;
  currentFileCount: number;
}

export default function DropZone({ onFilesSelected, currentFileCount }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(
    (fileList: FileList | File[]) => {
      const files = Array.from(fileList);
      const remaining = MAX_FILES_PER_UPLOAD - currentFileCount;

      if (remaining <= 0) {
        setError(`Maximum ${MAX_FILES_PER_UPLOAD} files allowed per upload.`);
        return;
      }

      const toProcess = files.slice(0, remaining);
      const errors: string[] = [];
      const valid: SelectedFile[] = [];

      toProcess.forEach((file) => {
        const result = validateFile(file);
        if (result.valid) {
          valid.push({
            file,
            id: generateClientId(),
            preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
          });
        } else {
          errors.push(result.error || 'Invalid file');
        }
      });

      if (errors.length > 0) {
        setError(errors.join('. '));
        setTimeout(() => setError(null), 5000);
      } else {
        setError(null);
      }

      if (valid.length > 0) {
        onFilesSelected(valid);
      }
    },
    [currentFileCount, onFilesSelected]
  );

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set false if leaving the drop zone itself
    if (e.currentTarget === e.target) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (e.dataTransfer.files?.length) {
        processFiles(e.dataTransfer.files);
      }
    },
    [processFiles]
  );

  const handleBrowse = () => {
    fileInputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      processFiles(e.target.files);
      // Reset input so same file can be selected again
      e.target.value = '';
    }
  };

  return (
    <div
      className={`drop-zone ${isDragging ? 'dragging' : ''}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleBrowse}
      role="button"
      tabIndex={0}
      aria-label="Upload land record document"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleBrowse();
        }
      }}
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPT_FILE_INPUT}
        multiple
        onChange={handleInputChange}
        style={{ display: 'none' }}
        aria-hidden
      />

      {/* Icon */}
      <div className="drop-zone-icon">
        <CloudUpload size={28} />
      </div>

      {/* Text */}
      <div className="drop-zone-title">
        {isDragging ? 'Drop your documents here' : 'Upload Land Record Documents'}
      </div>
      <div className="drop-zone-text">
        {isDragging
          ? 'Release to add files'
          : 'Drag & drop files here, or click to browse'}
      </div>

      {/* Browse Button */}
      {!isDragging && (
        <button
          type="button"
          className="drop-zone-browse"
          onClick={(e) => {
            e.stopPropagation();
            handleBrowse();
          }}
        >
          <FolderOpen size={16} />
          Browse Files
        </button>
      )}

      {/* Supported formats */}
      <div className="drop-zone-formats">
        {['PDF', 'JPG', 'PNG', 'TIFF'].map((fmt) => (
          <span key={fmt} className="format-badge">{fmt}</span>
        ))}
        <span className="format-badge" style={{ color: 'var(--color-text-secondary)' }}>
          Max 50 MB
        </span>
      </div>

      {/* Error message */}
      {error && (
        <div
          style={{
            marginTop: '1rem',
            color: 'var(--color-danger)',
            fontSize: '0.8rem',
            fontWeight: 600,
          }}
        >
          ⚠ {error}
        </div>
      )}
    </div>
  );
}
