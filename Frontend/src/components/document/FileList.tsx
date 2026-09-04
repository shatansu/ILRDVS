'use client';

import React from 'react';
import { FileText, Image, File, X } from 'lucide-react';
import { formatFileSize, getFileCategory } from '@/lib/file-utils';
import type { SelectedFile } from '@/types';

interface FileListProps {
  files: SelectedFile[];
  onRemove: (id: string) => void;
}

const FileIconMap = {
  pdf: { icon: FileText, className: 'file-icon-pdf', label: 'PDF' },
  image: { icon: Image, className: 'file-icon-image', label: 'IMG' },
  default: { icon: File, className: 'file-icon-default', label: 'FILE' },
};

export default function FileList({ files, onRemove }: FileListProps) {
  if (files.length === 0) return null;

  return (
    <div className="selected-files">
      <div className="selected-files-header">
        <h3 className="selected-files-title">Selected Files</h3>
        <span className="selected-files-count">
          {files.length} file{files.length !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="file-list">
        {files.map((sf) => {
          const cat = getFileCategory(sf.file.name);
          const { icon: Icon, className, label } = FileIconMap[cat];

          return (
            <div key={sf.id} className="file-item">
              <div className={`file-icon ${className}`}>
                <Icon size={18} />
              </div>
              <div className="file-info">
                <div className="file-name" title={sf.file.name}>
                  {sf.file.name}
                </div>
                <div className="file-size">
                  {formatFileSize(sf.file.size)} · {label}
                </div>
              </div>
              <button
                type="button"
                className="file-remove"
                onClick={() => onRemove(sf.id)}
                aria-label={`Remove ${sf.file.name}`}
                title="Remove file"
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
