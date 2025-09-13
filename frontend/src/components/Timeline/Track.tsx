import React, { useCallback } from 'react';
import { useDroppable } from '@dnd-kit/core';
import type { Track as TrackType } from '../../types/timeline';
import { Clip } from './Clip';
import { useTimelineStore } from '../../stores/timelineStore';

interface TrackProps {
  track: TrackType;
  index: number;
}

export const Track: React.FC<TrackProps> = ({ track, index }) => {
  const {
    addClip,
    removeTrack,
    updateTrack,
    deselectAllClips,
    pixelsPerSecond,
    duration
  } = useTimelineStore();

  const { setNodeRef, isOver } = useDroppable({
    id: track.id,
    data: { track }
  });

  const handleTrackClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const clickTime = x / pixelsPerSecond;

    if (e.altKey) {
      addClip(track.id, clickTime);
    } else {
      deselectAllClips();
    }
  }, [track.id, pixelsPerSecond, addClip, deselectAllClips]);

  const toggleMute = useCallback(() => {
    updateTrack(track.id, { muted: !track.muted });
  }, [track.id, track.muted, updateTrack]);

  const toggleLock = useCallback(() => {
    updateTrack(track.id, { locked: !track.locked });
  }, [track.id, track.locked, updateTrack]);

  const handleDelete = useCallback(() => {
    if (window.confirm(`Delete track "${track.name}"?`)) {
      removeTrack(track.id);
    }
  }, [track.id, track.name, removeTrack]);

  return (
    <div className={`track-container ${isOver ? 'drag-over' : ''}`}>
      <div className="track-header">
        <span className="track-number">{index + 1}</span>
        <input
          className="track-name"
          value={track.name}
          onChange={(e) => updateTrack(track.id, { name: e.target.value })}
        />
        <div className="track-controls">
          <button
            className={`track-btn ${track.muted ? 'active' : ''}`}
            onClick={toggleMute}
            title="Mute"
          >
            M
          </button>
          <button
            className={`track-btn ${track.locked ? 'active' : ''}`}
            onClick={toggleLock}
            title="Lock"
          >
            L
          </button>
          <button
            className="track-btn delete"
            onClick={handleDelete}
            title="Delete Track"
          >
            ✕
          </button>
        </div>
      </div>
      <div
        ref={setNodeRef}
        className={`track ${track.locked ? 'locked' : ''}`}
        style={{
          height: `${track.height}px`,
          width: `${duration * pixelsPerSecond}px`,
          borderLeftColor: track.color
        }}
        onClick={handleTrackClick}
      >
        {track.clips.map(clip => (
          <Clip key={clip.id} clip={clip} trackId={track.id} />
        ))}
      </div>
    </div>
  );
};