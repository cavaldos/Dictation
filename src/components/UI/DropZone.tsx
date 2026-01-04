import React, { useState, useCallback, useRef } from 'react';
import { Upload, FileText, X, Check } from 'lucide-react';

interface DropZoneProps {
  label: string;
  onFileLoad: (content: string) => void;
  accept?: string;
  fileName?: string;
  onClear?: () => void;
  className?: string;
}

const DropZone: React.FC<DropZoneProps> = ({
  label,
  onFileLoad,
  accept = '.srt,.vtt,.txt',
  fileName,
  onClear,
  className = '',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const processFile = useCallback((file: File) => {
    setError(null);
    
    // Validate file type
    const validExtensions = ['.srt', '.vtt', '.txt'];
    const fileExt = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
    
    if (!validExtensions.includes(fileExt)) {
      setError('Please upload a .srt, .vtt, or .txt file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        onFileLoad(content);
      }
    };
    reader.onerror = () => {
      setError('Failed to read file');
    };
    reader.readAsText(file);
  }, [onFileLoad]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  }, [processFile]);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
    // Reset input to allow selecting the same file again
    e.target.value = '';
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClear?.();
    setError(null);
  };

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />
      
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-6 transition-all cursor-pointer
          ${isDragging 
            ? 'border-primary bg-primary/10' 
            : fileName 
              ? 'border-green-500/50 bg-green-500/5' 
              : 'border-notion-border hover:border-primary/50 hover:bg-notion-hover/50'
          }
          ${error ? 'border-red-500/50 bg-red-500/5' : ''}
        `}
      >
        <div className="flex flex-col items-center gap-3 text-center">
          {fileName ? (
            <>
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <Check className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-notion-text">{label}</p>
                <p className="text-xs text-green-500 flex items-center gap-1 justify-center mt-1">
                  <FileText className="w-3 h-3" />
                  {fileName}
                </p>
              </div>
              <button
                onClick={handleClear}
                className="absolute top-2 right-2 p-1 rounded-full hover:bg-notion-hover transition-colors"
                title="Remove file"
              >
                <X className="w-4 h-4 text-notion-text-muted" />
              </button>
            </>
          ) : (
            <>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                isDragging ? 'bg-primary/20' : 'bg-notion-hover'
              }`}>
                <Upload className={`w-6 h-6 ${isDragging ? 'text-primary' : 'text-notion-text-muted'}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-notion-text">{label}</p>
                <p className="text-xs text-notion-text-muted mt-1">
                  Drag & drop or click to browse
                </p>
              </div>
            </>
          )}
        </div>

        {error && (
          <p className="text-xs text-red-400 mt-2 text-center">{error}</p>
        )}
      </div>
    </div>
  );
};

export default DropZone;
