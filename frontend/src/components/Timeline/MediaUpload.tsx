import React, { useCallback, useRef, useState } from 'react';
import type { MediaAsset } from '../../types/timeline';
import { saveMediaFile, generateFileId } from '../../utils/storage';
import { createId } from '../../utils/id';
import { StudioIcon } from '../StudioIcon';

interface MediaUploadProps {
  onUpload: (asset: MediaAsset) => void;
  onClose?: () => void;
}

const getMediaType = (mimeType: string): 'video' | 'audio' | 'image' => {
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.startsWith('image/')) return 'image';
  return 'video';
};

const generateVideoThumbnail = async (video: HTMLVideoElement): Promise<string> => {
  const canvas = document.createElement('canvas');
  canvas.width = 120;
  canvas.height = 68;
  const context = canvas.getContext('2d');

  if (!context) return '';

  video.currentTime = Math.min(1, video.duration / 2);
  await new Promise<void>((resolve) => {
    video.onseeked = () => resolve();
  });

  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.8);
};

const processFile = async (file: File): Promise<MediaAsset> => {
  const fileId = generateFileId();
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
  } else {
    const image = document.createElement('img');
    await new Promise<void>((resolve, reject) => {
      image.onload = () => {
        width = image.naturalWidth;
        height = image.naturalHeight;
        duration = 5;
        resolve();
      };
      image.onerror = reject;
      image.src = url;
    });
    thumbnailUrl = url;
  }

  try {
    await saveMediaFile(fileId, file);
  } catch (error) {
    console.error('Failed to save file to IndexedDB:', error);
  }

  return {
    id: createId('asset'),
    name: file.name,
    url,
    type,
    duration,
    width,
    height,
    thumbnailUrl,
    fileId
  };
};

export const MediaUpload: React.FC<MediaUploadProps> = ({ onUpload, onClose }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

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
            <button
              aria-label="Close media upload"
              className="close-btn"
              onClick={onClose}
              type="button"
            >
              <StudioIcon name="x" size={14} />
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
              <div className="upload-icon">
                <StudioIcon name="upload" size={22} />
              </div>
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
