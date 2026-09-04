/**
 * File utility helpers
 */

import { SUPPORTED_EXTENSIONS, MAX_FILE_SIZE } from '@/constants';

/** Format bytes to human-readable string */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

/** Check if a file extension is supported */
export function isSupportedFile(filename: string): boolean {
  const ext = '.' + filename.split('.').pop()?.toLowerCase();
  return SUPPORTED_EXTENSIONS.includes(ext as typeof SUPPORTED_EXTENSIONS[number]);
}

/** Get file extension category for icon rendering */
export function getFileCategory(filename: string): 'pdf' | 'image' | 'default' {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return 'pdf';
  if (['jpg', 'jpeg', 'png', 'tiff', 'tif'].includes(ext || '')) return 'image';
  return 'default';
}

/** Validate a file for upload */
export function validateFile(file: File): { valid: boolean; error?: string } {
  if (!isSupportedFile(file.name)) {
    return { valid: false, error: `Unsupported format: ${file.name}` };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `File too large (max 50MB): ${file.name}` };
  }
  if (file.size === 0) {
    return { valid: false, error: `Empty file: ${file.name}` };
  }
  return { valid: true };
}

/** Generate a unique document ID */
export function generateDocumentId(): string {
  const year = new Date().getFullYear();
  const seq = String(Math.floor(Math.random() * 999999)).padStart(6, '0');
  return `LR-${year}-${seq}`;
}

/** Generate a unique client-side ID */
export function generateClientId(): string {
  return `file_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
