import React, { useCallback } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useShallow } from 'zustand/react/shallow';
import type { Track as TrackType } from '../../types/timeline';
import { Clip } from './Clip';
import { useTimelineStore } from '../../stores/timelineStore';
import { StudioIcon } from '../StudioIcon';

interface TrackProps {
  track: TrackType;
  index: number;
  onOpenClipActions: (
    clipId: string,
    anchor: { x: number; y: number },
    splitTime: number
  ) => void;
}

export const Track: React.FC<TrackProps> = React.memo(function Track({
  track,
  index,
  onOpenClipActions,
}) {
  const {
    addClip,
    removeTrack,
    updateTrack,
    deselectAllClips,
    pixelsPerSecond,
    duration
  } = useTimelineStore(
    useShallow((state) => ({
      addClip: state.addClip,
      removeTrack: state.removeTrack,
      updateTrack: state.updateTrack,
      deselectAllClips: state.deselectAllClips,
      pixelsPerSecond: state.pixelsPerSecond,
      duration: state.duration,
    }))
  );

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

  const trackType = track.type || track.clips[0]?.type || 'video';
  const trackPrefix = trackType === 'audio' ? 'A' : trackType === 'text' ? 'T' : 'V';

  return (
    <div className={`track-container ${isOver ? 'drag-over' : ''}`}>
      <div className="track-header">
        <span className="track-number">{trackPrefix}{index + 1}</span>
        <input
          aria-label={`Rename ${track.name}`}
          className="track-name"
          value={track.name}
          onChange={(e) => updateTrack(track.id, { name: e.target.value })}
        />
        <div className="track-controls">
          <button
            className={`track-btn ${track.muted ? 'active' : ''}`}
            onClick={toggleMute}
            title={track.muted ? "Unmute track" : "Mute track"}
            aria-label={track.muted ? "Unmute track" : "Mute track"}
            aria-pressed={track.muted}
          >
            <StudioIcon name={track.muted ? "mute" : "volume"} size={13} />
          </button>
          <button
            className={`track-btn ${track.locked ? 'active' : ''}`}
            onClick={toggleLock}
            title={track.locked ? "Unlock track" : "Lock track"}
            aria-label={track.locked ? "Unlock track" : "Lock track"}
            aria-pressed={track.locked}
          >
            <StudioIcon name="lock" size={13} />
          </button>
          <button
            className="track-btn delete"
            onClick={handleDelete}
            title="Delete Track"
            aria-label={`Delete ${track.name}`}
          >
            <StudioIcon name="trash" size={13} />
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
          <Clip
            key={clip.id}
            clip={clip}
            trackId={track.id}
            onOpenActions={onOpenClipActions}
          />
        ))}
      </div>
    </div>
  );
});
