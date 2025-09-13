import React, { useState } from 'react';
import { useTimelineStore } from '../../stores/timelineStore';

interface TextEditorProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TextEditor: React.FC<TextEditorProps> = ({ isOpen, onClose }) => {
  const { tracks, addTextClip } = useTimelineStore();
  const [text, setText] = useState('');
  const [duration, setDuration] = useState(5);
  const [selectedTrackId, setSelectedTrackId] = useState('');

  const handleSubmit = () => {
    if (!text.trim()) return;

    const targetTrackId = selectedTrackId || tracks[0]?.id;
    if (!targetTrackId) return;

    addTextClip(targetTrackId, 0, text.trim(), duration);
    setText('');
    setDuration(5);
    onClose();
  };

  const handleCancel = () => {
    setText('');
    setDuration(5);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="text-editor-overlay">
      <div className="text-editor-modal">
        <div className="text-editor-header">
          <h3>Add Text Clip</h3>
          <button className="close-btn" onClick={handleCancel}>
            ✕
          </button>
        </div>

        <div className="text-editor-content">
          <div className="form-group">
            <label htmlFor="text-content">Text Content</label>
            <textarea
              id="text-content"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter your text here..."
              rows={4}
              autoFocus
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="duration">Duration (seconds)</label>
              <input
                id="duration"
                type="number"
                value={duration}
                onChange={(e) => setDuration(Math.max(0.1, Number(e.target.value)))}
                min="0.1"
                step="0.1"
              />
            </div>

            <div className="form-group">
              <label htmlFor="track-select">Target Track</label>
              <select
                id="track-select"
                value={selectedTrackId}
                onChange={(e) => setSelectedTrackId(e.target.value)}
              >
                <option value="">First available track</option>
                {tracks.map((track: any) => (
                  <option key={track.id} value={track.id}>
                    {track.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="text-preview">
            <div className="preview-label">Preview:</div>
            <div className="preview-text">
              {text || 'Enter text to preview...'}
            </div>
          </div>
        </div>

        <div className="text-editor-actions">
          <button className="btn btn-secondary" onClick={handleCancel}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={!text.trim()}
          >
            Add to Timeline
          </button>
        </div>
      </div>
    </div>
  );
};