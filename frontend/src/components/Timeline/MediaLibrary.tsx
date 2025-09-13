import React, { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { MediaUpload } from './MediaUpload';
import { useTimelineStore } from '../../stores/timelineStore';
import type { MediaAsset } from '../../types/timeline';

interface MediaLibraryProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MediaLibrary: React.FC<MediaLibraryProps> = ({ isOpen, onClose }) => {
  const { assets, addAsset, removeAsset } = useTimelineStore();
  const [showUpload, setShowUpload] = useState(false);

  const handleUpload = (asset: MediaAsset) => {
    addAsset(asset);
  };

  if (!isOpen) return null;

  return (
    <div className="media-library-sidebar">
      <div className="media-library-header">
        <h3>Media Library</h3>
        <div className="media-library-controls">
          <button
            className="toolbar-btn"
            onClick={() => setShowUpload(true)}
          >
            + Upload
          </button>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>
      </div>

      <div className="media-library-content">
        {assets.length === 0 ? (
          <div className="empty-library">
            <p>No media files yet</p>
            <button
              className="upload-first-btn"
              onClick={() => setShowUpload(true)}
            >
              Upload your first file
            </button>
          </div>
        ) : (
          <div className="media-grid">
            {assets.map(asset => (
              <MediaLibraryItem
                key={asset.id}
                asset={asset}
                onDelete={() => removeAsset(asset.id)}
              />
            ))}
          </div>
        )}
      </div>

      {showUpload && (
        <MediaUpload
          onUpload={handleUpload}
          onClose={() => setShowUpload(false)}
        />
      )}
    </div>
  );
};

interface MediaLibraryItemProps {
  asset: MediaAsset;
  onDelete: () => void;
}

const MediaLibraryItem: React.FC<MediaLibraryItemProps> = ({ asset, onDelete }) => {
  const [showDetails, setShowDetails] = useState(false);

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `asset-${asset.id}`,
    data: { asset }
  });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.5 : 1
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const getFileName = (url: string) => {
    return url.split('/').pop()?.split('.')[0] || 'Unknown';
  };

  return (
    <div
      ref={setNodeRef}
      className={`media-item ${isDragging ? 'dragging' : ''}`}
      style={style}
      {...attributes}
      {...listeners}
    >
      <div className="media-thumbnail">
        {asset.thumbnailUrl ? (
          <img src={asset.thumbnailUrl} alt={getFileName(asset.url)} />
        ) : (
          <div className="media-icon">
            {asset.type === 'video' ? '🎬' : asset.type === 'audio' ? '🎵' : '🖼️'}
          </div>
        )}
        <div className="media-type-badge">{asset.type}</div>
      </div>

      <div className="media-info">
        <div className="media-name">{getFileName(asset.url)}</div>
        <div className="media-duration">{formatDuration(asset.duration)}</div>
        {asset.width && asset.height && (
          <div className="media-resolution">{asset.width}×{asset.height}</div>
        )}
      </div>

      <div className="media-actions">
        <button
          className="action-btn"
          onClick={(e) => {
            e.stopPropagation();
            setShowDetails(!showDetails);
          }}
        >
          ℹ️
        </button>
        <button
          className="action-btn delete"
          onClick={(e) => {
            e.stopPropagation();
            if (confirm('Delete this media file?')) {
              onDelete();
            }
          }}
        >
          🗑️
        </button>
      </div>

      {showDetails && (
        <div className="media-details">
          <div>Type: {asset.type}</div>
          <div>Duration: {formatDuration(asset.duration)}</div>
          {asset.width && <div>Width: {asset.width}px</div>}
          {asset.height && <div>Height: {asset.height}px</div>}
        </div>
      )}
    </div>
  );
};