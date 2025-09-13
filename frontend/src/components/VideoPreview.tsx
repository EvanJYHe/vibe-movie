import React, { useMemo } from 'react';
import { Player } from '@remotion/player';
import { VideoComposition } from '../remotion/VideoComposition';
import { useTimelineStore } from '../stores/timelineStore';
import { convertTimelineToRemotionFormat } from '../utils/timeline';

export const VideoPreview: React.FC = () => {
  const { tracks, playheadPosition, duration, assets } = useTimelineStore();

  // Convert timeline data to Remotion format
  const remotionTimeline = useMemo(() => {
    return convertTimelineToRemotionFormat(tracks, assets);
  }, [tracks, assets]);

  const totalDurationInFrames = useMemo(() => {
    return Math.max(1, Math.floor(duration * 30)); // 30 fps
  }, [duration]);

  const currentFrame = useMemo(() => {
    return Math.floor(playheadPosition * 30); // 30 fps
  }, [playheadPosition]);

  if (tracks.length === 0 || !remotionTimeline.timeline.some(track => track.clips.length > 0)) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        color: '#666',
        fontSize: '18px'
      }}>
        Add clips to timeline to see preview
      </div>
    );
  }

  return (
    <Player
      component={VideoComposition}
      durationInFrames={totalDurationInFrames}
      compositionWidth={1920}
      compositionHeight={1080}
      fps={30}
      inputProps={{ timeline: remotionTimeline }}
      style={{
        width: '100%',
        height: '100%',
        maxWidth: '800px',
        maxHeight: '450px',
      }}
      controls={false}
      loop={false}
      showVolumeControls={false}
      clickToPlay={false}
      showPosterWhenUnplayed={false}
      showPosterWhenPaused={false}
      initialFrame={currentFrame}
    />
  );
};