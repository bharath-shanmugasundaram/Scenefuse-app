import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Film, AlertCircle, Check, FileVideo } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useEditorStore } from '@/store';
import { api } from '@/lib/api';
import type { VideoFile } from '@/types';

interface VideoUploadProps {
  onUploadComplete?: (video: VideoFile) => void;
}

export function VideoUpload({ onUploadComplete }: VideoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const setVideo = useEditorStore((state) => state.setVideo);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      if (!file.type.startsWith('video/')) {
        setError('Please upload a valid video file');
        return;
      }

      if (file.size > 500 * 1024 * 1024) {
        setError('File size must be less than 500MB');
        return;
      }

      setIsUploading(true);
      setError(null);
      setUploadProgress(0);

      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + Math.random() * 15;
        });
      }, 200);

      try {
        const response = await api.uploadVideo(file);
        clearInterval(progressInterval);
        setUploadProgress(100);

        if (response.success && response.data) {
          setVideo(response.data);
          onUploadComplete?.(response.data);
        } else {
          setError(response.error || 'Upload failed');
        }
      } catch {
        clearInterval(progressInterval);
        setError('Network error. Please try again.');
      } finally {
        setTimeout(() => {
          setIsUploading(false);
          setUploadProgress(0);
        }, 500);
      }
    },
    [setVideo, onUploadComplete]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.mov', '.avi', '.webm', '.mkv'],
    },
    maxFiles: 1,
    disabled: isUploading,
  });

  return (
    <div className="w-full max-w-2xl mx-auto">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div
        {...getRootProps()}
        className={cn(
          'relative border-2 border-dashed rounded-lg p-12 text-center transition-all duration-200 cursor-pointer',
          'hover:border-gray-400 hover:bg-gray-50/50',
          isDragActive && 'border-blue-500 bg-blue-50/50',
          isDragReject && 'border-red-500 bg-red-50/50',
          isUploading && 'pointer-events-none opacity-70'
        )}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center gap-4">
          {isUploading ? (
            <>
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                <Film className="w-8 h-8 text-blue-600 animate-pulse" />
              </div>
              <div className="space-y-2 w-full max-w-xs">
                <p className="text-sm font-medium text-gray-700">Uploading video...</p>
                <Progress value={uploadProgress} className="h-2" />
                <p className="text-xs text-gray-500">{Math.round(uploadProgress)}%</p>
              </div>
            </>
          ) : (
            <>
              <div
                className={cn(
                  'w-16 h-16 rounded-full flex items-center justify-center transition-colors',
                  isDragActive ? 'bg-blue-100' : 'bg-gray-100'
                )}
              >
                {isDragActive ? (
                  <Check className="w-8 h-8 text-blue-600" />
                ) : (
                  <Upload className="w-8 h-8 text-gray-500" />
                )}
              </div>

              <div className="space-y-2">
                <p className="text-lg font-medium text-gray-900">
                  {isDragActive
                    ? 'Drop your video here'
                    : 'Drag & drop your video here'}
                </p>
                <p className="text-sm text-gray-500">
                  or click to browse from your computer
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-400">
                <FileVideo className="w-4 h-4" />
                <span>MP4, MOV, AVI, WebM up to 500MB</span>
              </div>

              <Button
                type="button"
                variant="outline"
                className="mt-4"
                disabled={isUploading}
              >
                Select Video
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4 text-center">
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-2xl font-semibold text-gray-900">8</p>
          <p className="text-xs text-gray-500 mt-1">AI Models</p>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-2xl font-semibold text-gray-900">4K</p>
          <p className="text-xs text-gray-500 mt-1">Max Resolution</p>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-2xl font-semibold text-gray-900">30s</p>
          <p className="text-xs text-gray-500 mt-1">Avg. Processing</p>
        </div>
      </div>
    </div>
  );
}
