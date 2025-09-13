import type { VideoTimeline, Track, Clip } from '../types/timeline';

/**
 * Calculate the total duration of the video timeline in frames
 */
export const calculateTotalDuration = (timeline: VideoTimeline): number => {
  let maxEndFrame = 0;

  timeline.timeline.forEach((track: Track) => {
    track.clips.forEach((clip: Clip) => {
      const clipEndFrame = clip.startInFrames + clip.durationInFrames;
      if (clipEndFrame > maxEndFrame) {
        maxEndFrame = clipEndFrame;
      }
    });
  });

  return maxEndFrame;
};

/**
 * Get all clips that should be visible at a given frame
 */
export const getActiveClipsAtFrame = (timeline: VideoTimeline, frame: number): { track: Track; clip: Clip }[] => {
  const activeClips: { track: Track; clip: Clip }[] = [];

  timeline.timeline.forEach((track: Track) => {
    track.clips.forEach((clip: Clip) => {
      const clipStartFrame = clip.startInFrames;
      const clipEndFrame = clip.startInFrames + clip.durationInFrames;

      if (frame >= clipStartFrame && frame < clipEndFrame) {
        activeClips.push({ track, clip });
      }
    });
  });

  return activeClips;
};

/**
 * Calculate the local frame within a clip (0-based)
 */
export const getClipLocalFrame = (clip: Clip, globalFrame: number): number => {
  return globalFrame - clip.startInFrames;
};

/**
 * Check if an effect should be active at a given local frame within a clip
 */
export const isEffectActive = (effect: any, localFrame: number, clipDuration: number): boolean => {
  switch (effect.type) {
    case 'fade-in':
      return localFrame < effect.durationInFrames;
    case 'fade-out':
      return localFrame >= clipDuration - effect.durationInFrames;
    case 'slide-in':
      return localFrame < effect.durationInFrames;
    default:
      return false;
  }
};

/**
 * Calculate effect progress (0-1) for animations
 */
export const getEffectProgress = (effect: any, localFrame: number, clipDuration: number): number => {
  switch (effect.type) {
    case 'fade-in':
      if (localFrame >= effect.durationInFrames) return 1;
      return localFrame / effect.durationInFrames;
    case 'fade-out':
      const fadeOutStart = clipDuration - effect.durationInFrames;
      if (localFrame < fadeOutStart) return 0;
      return (localFrame - fadeOutStart) / effect.durationInFrames;
    case 'slide-in':
      if (localFrame >= effect.durationInFrames) return 1;
      return localFrame / effect.durationInFrames;
    default:
      return 1;
  }
};