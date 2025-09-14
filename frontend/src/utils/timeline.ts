import type {
  VideoTimeline,
  Track,
  Clip,
  MediaAsset
} from '../types/timeline';

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
export const getClipLocalFrame = (clip: Clip | { startInFrames: number }, globalFrame: number): number => {
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

/**
 * Convert timeline to Remotion format (now simplified)
 */
export const convertTimelineToRemotionFormat = (
  tracks: Track[],
  assets: MediaAsset[]
): VideoTimeline => {
  const fps = 30;

  // Ensure clips have frame-based properties calculated
  const processedTracks = tracks.map(track => ({
    ...track,
    clips: track.clips.map(clip => {
      // Debug text clips
      if (clip.type === 'text') {
        console.log('Converting text clip:', clip);
      }

      // Ensure frame values are calculated - prefer existing frame values if valid
      const startInFrames = (typeof clip.startInFrames === 'number' && !isNaN(clip.startInFrames))
        ? clip.startInFrames
        : Math.floor(clip.startTime * fps);

      const durationInFrames = (typeof clip.durationInFrames === 'number' && !isNaN(clip.durationInFrames))
        ? clip.durationInFrames
        : Math.floor(clip.duration * fps);

      const processedClip = {
        ...clip,
        startInFrames: Math.max(0, startInFrames),
        durationInFrames: Math.max(1, durationInFrames), // Ensure at least 1 frame
        // Ensure text clips have default style
        style: clip.type === 'text' ? {
          fontFamily: 'Arial, sans-serif',
          fontSize: 48,
          fontWeight: 'bold',
          color: 'white',
          textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
          ...clip.style
        } : clip.style
      };

      // Debug text clips after processing
      if (clip.type === 'text') {
        console.log('Processed text clip:', processedClip);
      }

      return processedClip;
    })
  }));

  return {
    project: {
      width: 1920,
      height: 1080,
      fps,
    },
    timeline: processedTracks,
  };
};