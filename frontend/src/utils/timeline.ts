import type {
  VideoTimeline,
  RemotionTrack,
  RemotionClip,
  RemotionVideoClip,
  Track as TimelineTrack,
  Clip as TimelineClip,
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
export const getClipLocalFrame = (clip: RemotionClip | { startInFrames: number }, globalFrame: number): number => {
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
 * Convert timeline editor format to Remotion format
 */
export const convertTimelineToRemotionFormat = (
  tracks: TimelineTrack[],
  assets: MediaAsset[]
): VideoTimeline => {
  const fps = 30;

  const remotionTracks: RemotionTrack[] = tracks
    .filter(track => track.clips.length > 0)
    .map(track => {
      const clips: RemotionClip[] = track.clips
        .filter(clip => clip.assetUrl || clip.assetId)
        .map(clip => {
          // Get asset details if available
          const asset = clip.assetId ? assets.find(a => a.id === clip.assetId) : null;
          const assetUrl = clip.assetUrl || asset?.url;

          if (!assetUrl) return null;

          const remotionClip: RemotionVideoClip = {
            id: clip.id,
            assetUrl,
            startInFrames: Math.floor(clip.startTime * fps),
            durationInFrames: Math.floor(clip.duration * fps),
            sourceIn: Math.floor(clip.trimStart * fps), // Convert trim start to frames
            sourceOut: Math.floor((clip.trimStart + clip.duration) * fps), // Convert trim end to frames
            effects: clip.effects,
            scale: clip.scale,
            position: clip.position,
            rotation: clip.rotation,
            opacity: clip.opacity,
          };

          return remotionClip;
        })
        .filter((clip): clip is RemotionClip => clip !== null);

      return {
        id: track.id,
        type: 'video' as const,
        clips,
      };
    });

  return {
    project: {
      width: 1920,
      height: 1080,
      fps,
    },
    timeline: remotionTracks,
  };
};