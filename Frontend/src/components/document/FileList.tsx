'use client';

import React, { useState } from 'react';
import { FileText, Image as ImageIcon, File, Eye, Trash2 } from 'lucide-react';
import { formatFileSize, getFileCategory } from '@/lib/file-utils';
import type { SelectedFile } from '@/types';
import FilePreviewModal from './FilePreviewModal';

interface FileListProps {
  files: SelectedFile[];
  onRemove: (id: string) => void;
}

const FileIconMap = {
  pdf: { icon: FileText, className: 'file-icon-pdf', label: 'PDF' },
  image: { icon: ImageIcon, className: 'file-icon-image', label: 'IMG' },
  default: { icon: File, className: 'file-icon-default', label: 'FILE' },
};

export default function FileList({ files, onRemove }: FileListProps) {
  const [previewFile, setPreviewFile] = useState<SelectedFile | null>(null);

  if (files.length === 0) return null;

  return (
    <>
      <div className="selected-files">
        <div className="selected-files-header">
          <h3 className="selected-files-title">
            {files.length === 1 ? 'Selected File' : 'Selected Files'}
          </h3>
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
                  <Icon size={20} />
                </div>

                <div className="file-info">
                  <div className="file-name" title={sf.file.name}>
                    {sf.file.name}
                  </div>
                  <div className="file-size">
                    {formatFileSize(sf.file.size)} • {label}
                  </div>
                </div>

                <div className="file-actions">
                  <button
                    type="button"
                    className="btn-file-action btn-file-preview"
                    onClick={() => setPreviewFile(sf)}
                    title="Preview file"
                  >
                    <Eye size={14} />
                    <span>Preview</span>
                  </button>

                  <button
                    type="button"
                    className="btn-file-action btn-file-remove"
                    onClick={() => onRemove(sf.id)}
                    title="Remove file"
                  >
                    <Trash2 size={14} />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* In-app Preview Modal */}
      <FilePreviewModal
        file={previewFile}
        onClose={() => setPreviewFile(null)}
      />
    </>
  );
}
