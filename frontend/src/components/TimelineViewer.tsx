import React, { useState } from 'react';
import type { VideoTimeline, Track, Clip, VideoClip, TextClip } from '../types/timeline';
import { calculateTotalDuration } from '../utils/timeline';
import { timelineStorage } from '../utils/timelineStorage';

interface TimelineViewerProps {
  timeline: VideoTimeline;
  onTimelineUpdate: (timeline: VideoTimeline) => void;
}

const ClipItem: React.FC<{ clip: Clip; trackType: string }> = ({ clip, trackType }) => {
  const isVideoClip = (clip: Clip): clip is VideoClip => 'assetUrl' in clip;
  const isTextClip = (clip: Clip): clip is TextClip => 'text' in clip;

  return (
    <div style={{
      padding: '8px 12px',
      margin: '4px 0',
      backgroundColor: trackType === 'video' ? '#e3f2fd' : '#f3e5f5',
      border: `1px solid ${trackType === 'video' ? '#2196f3' : '#9c27b0'}`,
      borderRadius: '6px',
      fontSize: '12px',
    }}>
      <div style={{ fontWeight: '600', marginBottom: '4px' }}>
        {clip.id}
      </div>
      <div style={{ color: '#666' }}>
        Start: {clip.startInFrames}f | Duration: {clip.durationInFrames}f
      </div>
      {isVideoClip(clip) && (
        <div style={{ color: '#666', fontSize: '11px', marginTop: '2px' }}>
          Video: {clip.assetUrl.split('/').pop()}
        </div>
      )}
      {isTextClip(clip) && (
        <div style={{ color: '#666', fontSize: '11px', marginTop: '2px' }}>
          Text: "{clip.text}"
        </div>
      )}
      {clip.effects && clip.effects.length > 0 && (
        <div style={{ color: '#666', fontSize: '11px', marginTop: '2px' }}>
          Effects: {clip.effects.map(e => e.type).join(', ')}
        </div>
      )}
    </div>
  );
};

const TrackItem: React.FC<{ track: Track }> = ({ track }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div style={{
      margin: '8px 0',
      border: '1px solid #ddd',
      borderRadius: '8px',
      backgroundColor: 'white',
    }}>
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          padding: '12px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px 8px 0 0',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: isExpanded ? '1px solid #ddd' : 'none',
        }}
      >
        <div>
          <span style={{ fontWeight: '600', fontSize: '14px' }}>
            {track.id}
          </span>
          <span style={{
            marginLeft: '8px',
            padding: '2px 8px',
            backgroundColor: track.type === 'video' ? '#2196f3' : '#9c27b0',
            color: 'white',
            borderRadius: '12px',
            fontSize: '11px',
          }}>
            {track.type}
          </span>
          <span style={{ marginLeft: '8px', color: '#666', fontSize: '12px' }}>
            {track.clips.length} clip{track.clips.length !== 1 ? 's' : ''}
          </span>
        </div>
        <span style={{ fontSize: '12px', color: '#666' }}>
          {isExpanded ? '▼' : '▶'}
        </span>
      </div>
      {isExpanded && (
        <div style={{ padding: '12px' }}>
          {track.clips.length === 0 ? (
            <div style={{ color: '#999', fontStyle: 'italic', fontSize: '12px' }}>
              No clips in this track
            </div>
          ) : (
            track.clips.map((clip) => (
              <ClipItem key={clip.id} clip={clip} trackType={track.type} />
            ))
          )}
        </div>
      )}
    </div>
  );
};

export const TimelineViewer: React.FC<TimelineViewerProps> = ({ timeline, onTimelineUpdate }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const totalDuration = calculateTotalDuration(timeline);
  const totalSeconds = Math.round(totalDuration / timeline.project.fps * 10) / 10;

  const handleResetTimeline = () => {
    if (confirm('Are you sure you want to reset the timeline to default? This will clear all changes.')) {
      timelineStorage.clearTimeline();
      // Reload the page to get the default timeline
      window.location.reload();
    }
  };

  const handleExportTimeline = () => {
    const dataStr = JSON.stringify(timeline, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'timeline.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{
      width: '100%',
      maxWidth: '800px',
      backgroundColor: '#f8f9fa',
      border: '1px solid #ddd',
      borderRadius: '8px',
    }}>
      {/* Header Bar */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          padding: '12px 20px',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#fff',
          borderBottom: isExpanded ? '1px solid #ddd' : 'none',
          borderRadius: isExpanded ? '8px 8px 0 0' : '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontWeight: '600', fontSize: '14px' }}>
            Timeline Inspector
          </span>
          <span style={{ fontSize: '12px', color: '#666' }}>
            {timeline.timeline.length} track{timeline.timeline.length !== 1 ? 's' : ''} | 
            {totalDuration} frames ({totalSeconds}s) | 
            {timeline.project.width}×{timeline.project.height} @ {timeline.project.fps}fps
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isExpanded && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); handleExportTimeline(); }}
                style={{
                  padding: '4px 8px',
                  fontSize: '11px',
                  border: '1px solid #007bff',
                  borderRadius: '4px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  cursor: 'pointer',
                }}
              >
                Export
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleResetTimeline(); }}
                style={{
                  padding: '4px 8px',
                  fontSize: '11px',
                  border: '1px solid #dc3545',
                  borderRadius: '4px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  cursor: 'pointer',
                }}
              >
                Reset
              </button>
            </>
          )}
          <span style={{ fontSize: '12px', color: '#666' }}>
            {isExpanded ? '▼ Hide' : '▲ Show'}
          </span>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div style={{
          maxHeight: '400px',
          overflowY: 'auto',
          padding: '16px 20px',
          backgroundColor: '#f8f9fa',
        }}>
          {/* Project Settings */}
          <div style={{
            marginBottom: '16px',
            padding: '12px',
            backgroundColor: 'white',
            border: '1px solid #ddd',
            borderRadius: '8px',
          }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600' }}>
              Project Settings
            </h4>
            <div style={{ fontSize: '12px', color: '#666' }}>
              Resolution: {timeline.project.width} × {timeline.project.height} | 
              Frame Rate: {timeline.project.fps} fps
            </div>
          </div>

          {/* Tracks */}
          <div>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600' }}>
              Tracks ({timeline.timeline.length})
            </h4>
            {timeline.timeline.length === 0 ? (
              <div style={{ 
                color: '#999', 
                fontStyle: 'italic', 
                fontSize: '12px',
                padding: '20px',
                textAlign: 'center',
                backgroundColor: 'white',
                border: '1px solid #ddd',
                borderRadius: '8px',
              }}>
                No tracks in timeline
              </div>
            ) : (
              timeline.timeline.map((track) => (
                <TrackItem key={track.id} track={track} />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
