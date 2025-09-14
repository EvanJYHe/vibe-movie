import { Sequence, Video, useCurrentFrame, AbsoluteFill, Img } from 'remotion';
import type { VideoTimeline, Track, Clip } from '../types/timeline';
import { getClipLocalFrame, isEffectActive, getEffectProgress } from '../utils/timeline';

interface VideoCompositionProps {
  timeline: VideoTimeline;
}

const VideoClipComponent: React.FC<{ clip: Clip; track: Track }> = ({ clip }) => {
  const frame = useCurrentFrame();
  const localFrame = getClipLocalFrame(clip, frame);

  let opacity = 1;
  if (clip.effects) {
    clip.effects.forEach((effect) => {
      if (isEffectActive(effect, localFrame, clip.durationInFrames)) {
        const progress = getEffectProgress(effect, localFrame, clip.durationInFrames);
        if (effect.type === 'fade-in') {
          opacity = Math.min(opacity, progress);
        } else if (effect.type === 'fade-out') {
          opacity = Math.min(opacity, 1 - progress);
        }
      }
    });
  }

  const handleVideoError = (error: Error) => {
    console.warn('Video playback error for clip:', clip.id, error.message);
  };

  // Check if video is vertical (height > width) and center it
  const videoStyle = { width: '100%', height: '100%' };
  const containerStyle: React.CSSProperties = {
    opacity,
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'black'
  };

  // If we have video dimensions from the asset, check if it's vertical
  // Note: We'd need to get asset info from the store, for now use objectFit
  return (
    <div style={containerStyle}>
      <Video
        src={clip.assetUrl}
        style={{
          ...videoStyle,
          objectFit: 'contain', // This centers and scales the video properly
          maxWidth: '100%',
          maxHeight: '100%'
        }}
        startFrom={clip.trimStart ? Math.floor(clip.trimStart * 30) : 0}
        endAt={clip.trimEnd ? Math.floor((clip.trimStart || 0 + clip.duration) * 30) : undefined}
        onError={handleVideoError}
        volume={clip.volume ?? 1}
        muted={false}
      />
    </div>
  );
};

const TextClipComponent: React.FC<{ clip: Clip; track: Track }> = ({ clip }) => {
  const frame = useCurrentFrame();
  const localFrame = getClipLocalFrame(clip, frame);

  let opacity = 1;
  let transform = 'translate(-50%, -50%)';

  // Add defensive checks for effect processing
  if (clip.effects && Array.isArray(clip.effects)) {
    console.log('Processing effects for clip:', clip.id, 'frame:', frame, 'localFrame:', localFrame, 'durationInFrames:', clip.durationInFrames);

    try {
      clip.effects.forEach((effect) => {
        // Validate effect and frame values
        if (!effect || typeof effect !== 'object' || !effect.type) {
          console.warn('Invalid effect:', effect);
          return;
        }

        if (typeof localFrame !== 'number' || isNaN(localFrame)) {
          console.warn('Invalid localFrame:', localFrame);
          return;
        }

        if (typeof clip.durationInFrames !== 'number' || isNaN(clip.durationInFrames) || clip.durationInFrames <= 0) {
          console.warn('Invalid durationInFrames:', clip.durationInFrames);
          return;
        }

        if (typeof effect.durationInFrames !== 'number' || isNaN(effect.durationInFrames) || effect.durationInFrames <= 0) {
          console.warn('Invalid effect durationInFrames:', effect.durationInFrames);
          return;
        }

        if (isEffectActive(effect, localFrame, clip.durationInFrames)) {
          const progress = getEffectProgress(effect, localFrame, clip.durationInFrames);

          if (typeof progress !== 'number' || isNaN(progress)) {
            console.warn('Invalid effect progress:', progress);
            return;
          }

          console.log('Effect active:', effect.type, 'progress:', progress);

          if (effect.type === 'fade-in') {
            opacity = Math.min(opacity, Math.max(0, progress));
          } else if (effect.type === 'fade-out') {
            opacity = Math.min(opacity, Math.max(0, 1 - progress));
          } else if (effect.type === 'slide-in' && effect.direction === 'from-bottom') {
            const translateY = (1 - progress) * 100;
            transform = `translate(-50%, calc(-50% + ${translateY}px))`;
          }
        }
      });
    } catch (error) {
      console.error('Error processing effects for clip:', clip.id, error);
      opacity = 1; // Fallback to fully visible
    }

    // Ensure opacity is valid
    if (typeof opacity !== 'number' || isNaN(opacity)) {
      console.warn('Invalid final opacity:', opacity, 'resetting to 1');
      opacity = 1;
    }
    opacity = Math.max(0, Math.min(1, opacity));

    console.log('Final opacity for clip:', clip.id, opacity);
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform,
        opacity,
        fontFamily: clip.style?.fontFamily || 'Arial, sans-serif',
        fontSize: clip.style?.fontSize || 48,
        fontWeight: clip.style?.fontWeight || 'bold',
        color: clip.style?.color || 'white',
        textAlign: 'center',
        whiteSpace: 'nowrap',
        textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
      }}
    >
      {clip.text || clip.name}
    </div>
  );
};

const ImageClipComponent: React.FC<{ clip: Clip; track: Track }> = ({ clip }) => {
  const frame = useCurrentFrame();
  const localFrame = getClipLocalFrame(clip, frame);

  let opacity = clip.opacity ?? 1;
  let scale = clip.scale ?? 1;
  let rotation = clip.rotation ?? 0;

  if (clip.effects) {
    clip.effects.forEach((effect) => {
      if (isEffectActive(effect, localFrame, clip.durationInFrames)) {
        const progress = getEffectProgress(effect, localFrame, clip.durationInFrames);
        if (effect.type === 'fade-in') {
          opacity = Math.min(opacity, progress);
        } else if (effect.type === 'fade-out') {
          opacity = Math.min(opacity, 1 - progress);
        }
      }
    });
  }

  const transform = `scale(${scale}) rotate(${rotation}deg)`;
  const position = clip.position || { x: 0.5, y: 0.5 };

  return (
    <div
      style={{
        position: 'absolute',
        left: `${position.x * 100}%`,
        top: `${position.y * 100}%`,
        transform: `translate(-50%, -50%) ${transform}`,
        opacity,
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Img
        src={clip.assetUrl}
        style={{
          maxWidth: '100%',
          maxHeight: '100%',
          objectFit: 'contain',
        }}
      />
    </div>
  );
};

export const VideoComposition: React.FC<VideoCompositionProps> = ({ timeline }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: 'black' }}>
      {timeline.timeline.map((track) => (
        <div key={track.id}>
          {track.clips.map((clip) => (
            <Sequence
              key={clip.id}
              from={clip.startInFrames}
              durationInFrames={clip.durationInFrames}
            >
              {(() => {
                // Debug clip rendering
                if (clip.type === 'text') {
                  console.log('Rendering text clip in VideoComposition:', clip);
                }

                // Use explicit type field for clip type detection
                switch (clip.type) {
                  case 'text':
                    return <TextClipComponent clip={clip} track={track} />;
                  case 'video':
                  case 'audio':
                    return <VideoClipComponent clip={clip} track={track} />;
                  case 'image':
                    return <ImageClipComponent clip={clip} track={track} />;
                  default:
                    console.warn('Unknown clip type:', clip.type, clip);
                    return null;
                }
              })()}
            </Sequence>
          ))}
        </div>
      ))}
    </AbsoluteFill>
  );
};