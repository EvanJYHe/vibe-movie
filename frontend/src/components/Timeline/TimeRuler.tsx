import React, { useMemo, type CSSProperties } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useTimelineStore } from '../../stores/timelineStore';

function getMarkerInterval(pixelsPerSecond: number) {
  const targetSeconds = 128 / Math.max(pixelsPerSecond, 1);
  return [1, 2, 4, 8, 10, 20, 30, 60].find(
    (interval) => interval >= targetSeconds
  ) ?? 60;
}

export const TimeRuler: React.FC = React.memo(function TimeRuler() {
  const { duration, pixelsPerSecond } = useTimelineStore(
    useShallow((state) => ({
      duration: state.duration,
      pixelsPerSecond: state.pixelsPerSecond,
    }))
  );

  const markers = useMemo(() => {
    const markerInterval = getMarkerInterval(pixelsPerSecond);
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

  const markerInterval = getMarkerInterval(pixelsPerSecond);

  return (
    <div className="time-ruler">
      <div className="ruler-header" aria-hidden="true" />
      <div
        className="ruler-track"
        style={
          {
            width: `${duration * pixelsPerSecond}px`,
            "--ruler-step": `${markerInterval * pixelsPerSecond}px`,
          } as CSSProperties
        }
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
});

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
