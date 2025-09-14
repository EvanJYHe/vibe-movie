import React, { useMemo, useCallback } from 'react';
import { useTimelineStore } from '../../stores/timelineStore';

export const TimeRuler: React.FC = () => {
  const { duration, pixelsPerSecond, setPlayheadPosition } = useTimelineStore();

  const markers = useMemo(() => {
    const markerInterval = pixelsPerSecond < 30 ? 5 : pixelsPerSecond < 60 ? 2 : 1;
    const markers = [];

    for (let time = 0; time <= duration; time += markerInterval) {
      markers.push({
        time,
        position: time * pixelsPerSecond,
        label: formatTime(time)
      });
    }

    return markers;
  }, [duration, pixelsPerSecond]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    const rulerTrack = e.currentTarget as HTMLElement;
    const rect = rulerTrack.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const newTime = Math.min(duration, Math.max(0, x / pixelsPerSecond));
    setPlayheadPosition(newTime);
  }, [duration, pixelsPerSecond, setPlayheadPosition]);

  return (
    <div className="time-ruler">
      <div className="ruler-header" />
      <div
        className="ruler-track"
        style={{ width: `${duration * pixelsPerSecond}px`, cursor: 'pointer' }}
        onClick={handleClick}
      >
        {markers.map(marker => (
          <div
            key={marker.time}
            className="time-marker"
            style={{ left: `${marker.position}px` }}
          >
            <div className="marker-line" />
            <span className="marker-label">{marker.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}