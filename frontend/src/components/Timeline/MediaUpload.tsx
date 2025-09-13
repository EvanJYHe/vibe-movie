import React, { useCallback, useRef, useState } from 'react';
import type { MediaAsset } from '../../types/timeline';

interface MediaUploadProps {
  onUpload: (asset: MediaAsset) => void;
  onClose?: () => void;
}

export const MediaUpload: React.FC<MediaUploadProps> = ({ onUpload, onClose }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const handleFileSelect = useCallback(async (files: FileList) => {
    if (!files.length) return;

    setUploading(true);
    setProgress(0);

    for (const file of Array.from(files)) {
      try {
        const asset = await processFile(file);
        onUpload(asset);
        setProgress(100);
      } catch (error) {
        console.error('Failed to process file:', error);
      }
    }

    setUploading(false);
    setProgress(0);
    onClose?.();
  }, [onUpload, onClose]);

  const processFile = async (file: File): Promise<MediaAsset> => {
    const url = URL.createObjectURL(file);
    const type = getMediaType(file.type);

    let duration = 0;
    let width: number | undefined;
    let height: number | undefined;
    let thumbnailUrl: string | undefined;

    if (type === 'video') {
      const video = document.createElement('video');
      video.preload = 'metadata';

      await new Promise<void>((resolve, reject) => {
        video.onloadedmetadata = () => {
          duration = video.duration;
          width = video.videoWidth;
          height = video.videoHeight;
          resolve();
        };
        video.onerror = reject;
        video.src = url;
      });

      // Generate thumbnail
      thumbnailUrl = await generateVideoThumbnail(video);
    } else if (type === 'audio') {
      const audio = document.createElement('audio');
      await new Promise<void>((resolve, reject) => {
        audio.onloadedmetadata = () => {
          duration = audio.duration;
          resolve();
        };
        audio.onerror = reject;
        audio.src = url;
      });
    } else if (type === 'image') {
      const img = document.createElement('img');
      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          width = img.naturalWidth;
          height = img.naturalHeight;
          duration = 5; // Default 5 second duration for images
          resolve();
        };
        img.onerror = reject;
        img.src = url;
      });
      thumbnailUrl = url;
    }

    return {
      id: generateId(),
      url,
      type,
      duration,
      width,
      height,
      thumbnailUrl
    };
  };

  const generateVideoThumbnail = async (video: HTMLVideoElement): Promise<string> => {
    const canvas = document.createElement('canvas');
    canvas.width = 120;
    canvas.height = 68;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      video.currentTime = Math.min(1, video.duration / 2); // Middle of video or 1 second
      await new Promise(resolve => {
        video.onseeked = resolve;
      });

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/jpeg', 0.8);
    }

    return '';
  };

  const getMediaType = (mimeType: string): 'video' | 'audio' | 'image' => {
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.startsWith('image/')) return 'image';
    return 'video'; // default
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  return (
    <div className="media-upload-modal">
      <div className="media-upload-content">
        <div className="media-upload-header">
          <h3>Upload Media</h3>
          {onClose && (
            <button className="close-btn" onClick={onClose}>
              ✕
            </button>
          )}
        </div>

        <div
          className="media-upload-drop-zone"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? (
            <div className="upload-progress">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p>Processing media...</p>
            </div>
          ) : (
            <>
              <div className="upload-icon">📁</div>
              <p>Drop files here or click to browse</p>
              <small>Supports MP4, WebM, MOV, MP3, WAV, JPG, PNG</small>
            </>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="video/*,audio/*,image/*"
          multiple
          style={{ display: 'none' }}
          onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
        />
      </div>
    </div>
  );
};