import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { Player } from '@remotion/player';
import { VideoComposition } from '../remotion/VideoComposition';
import { useTimelineStore } from '../stores/timelineStore';
import { convertTimelineToRemotionFormat } from '../utils/timeline';

export const VideoPreview: React.FC = () => {
  const { tracks, playheadPosition, duration, assets, setPlayheadPosition } = useTimelineStore();
  const playerRef = useRef<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

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

  // Sync player with timeline playhead position
  useEffect(() => {
    if (playerRef.current && !isPlaying) {
      playerRef.current.seekTo(currentFrame);
    }
  }, [currentFrame, isPlaying]);

  // Play/pause handlers
  const togglePlayPause = useCallback(() => {
    if (!playerRef.current) return;

    if (isPlaying) {
      playerRef.current.pause();
      setIsPlaying(false);
    } else {
      playerRef.current.play();
      setIsPlaying(true);
    }
  }, [isPlaying]);

  // Update timeline playhead when video plays
  const handleTimeUpdate = useCallback(() => {
    if (playerRef.current && isPlaying) {
      const currentFrame = playerRef.current.getCurrentFrame();
      const timeInSeconds = currentFrame / 30; // 30 fps
      setCurrentTime(timeInSeconds);
      setPlayheadPosition(timeInSeconds);
    }
  }, [isPlaying, setPlayheadPosition]);

  // Set up time update interval when playing
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isPlaying) {
      interval = setInterval(handleTimeUpdate, 1000 / 30); // 30 fps update
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, handleTimeUpdate]);

  // Stop playback at end
  useEffect(() => {
    if (currentTime >= duration && isPlaying) {
      setIsPlaying(false);
      if (playerRef.current) {
        playerRef.current.pause();
      }
    }
  }, [currentTime, duration, isPlaying]);

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
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Player
        ref={playerRef}
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
      <button
        onClick={togglePlayPause}
        style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          border: '2px solid rgba(255, 255, 255, 0.8)',
          color: 'white',
          fontSize: '18px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease',
          backdropFilter: 'blur(4px)',
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 1)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.8)';
        }}
      >
        {isPlaying ? '⏸' : '▶'}
      </button>
    </div>
  );
};