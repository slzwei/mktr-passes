import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Check } from 'lucide-react';
import { Button } from './ui/Button';

interface ImageUploadProps {
  role: string;
  required: boolean;
  recommendedSize: { w: number; h: number };
  onUpload: (file: File) => void;
  currentAssetId?: string;
}

export function ImageUpload({
  role,
  required,
  recommendedSize,
  onUpload,
  currentAssetId,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/png': ['.png'],
    },
    maxFiles: 1,
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];
      setError(null);
      setUploading(true);

      try {
        onUpload(file);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setUploading(false);
      }
    },
  });

  return (
    <div>
      <label className="label">
        {role}
        {required && <span className="text-red-500 ml-1">*</span>}
        <span className="text-gray-500 ml-2">
          ({recommendedSize.w}×{recommendedSize.h})
        </span>
      </label>

      {currentAssetId ? (
        <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-center">
            <Check className="w-4 h-4 text-green-600 mr-2" />
            <span className="text-sm text-green-800">Image uploaded</span>
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              // TODO: Remove image
            }}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-primary-400 bg-primary-50' : 'border-gray-300'}
            ${uploading ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary-400'}
          `}
        >
          <input {...getInputProps()} disabled={uploading} />
          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">
            {isDragActive
              ? 'Drop the image here'
              : 'Drag & drop a PNG image here, or click to select'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Recommended: {recommendedSize.w}×{recommendedSize.h} pixels
          </p>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 mt-1">{error}</p>
      )}

      {uploading && (
        <p className="text-sm text-gray-600 mt-1">Uploading...</p>
      )}
    </div>
  );
}
