import { Sequence, Video, useCurrentFrame, AbsoluteFill } from 'remotion';
import type { VideoTimeline, RemotionTrack, RemotionVideoClip, RemotionTextClip } from '../types/timeline';
import { getClipLocalFrame, isEffectActive, getEffectProgress } from '../utils/timeline';

interface VideoCompositionProps {
  timeline: VideoTimeline;
}

const VideoClipComponent: React.FC<{ clip: RemotionVideoClip; track: RemotionTrack }> = ({ clip }) => {
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

  return (
    <div style={{ opacity }}>
      <Video
        src={clip.assetUrl}
        style={{ width: '100%', height: '100%' }}
        startFrom={clip.sourceIn || 0}
        endAt={clip.sourceOut}
        onError={handleVideoError}
        volume={clip.volume ?? 1}
        muted={false}
      />
    </div>
  );
};

const TextClipComponent: React.FC<{ clip: RemotionTextClip; track: RemotionTrack }> = ({ clip }) => {
  const frame = useCurrentFrame();
  const localFrame = getClipLocalFrame(clip, frame);

  let opacity = 1;
  let transform = 'translate(-50%, -50%)';

  if (clip.effects) {
    clip.effects.forEach((effect) => {
      if (isEffectActive(effect, localFrame, clip.durationInFrames)) {
        const progress = getEffectProgress(effect, localFrame, clip.durationInFrames);

        if (effect.type === 'fade-in') {
          opacity = Math.min(opacity, progress);
        } else if (effect.type === 'fade-out') {
          opacity = Math.min(opacity, 1 - progress);
        } else if (effect.type === 'slide-in' && effect.direction === 'from-bottom') {
          const translateY = (1 - progress) * 100;
          transform = `translate(-50%, calc(-50% + ${translateY}px))`;
        }
      }
    });
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform,
        opacity,
        fontFamily: clip.style.fontFamily,
        fontSize: clip.style.fontSize,
        fontWeight: clip.style.fontWeight,
        color: clip.style.color,
        textAlign: 'center',
        whiteSpace: 'nowrap',
        textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
      }}
    >
      {clip.text}
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
              {track.type === 'video' ? (
                <VideoClipComponent clip={clip as RemotionVideoClip} track={track} />
              ) : track.type === 'text' ? (
                <TextClipComponent clip={clip as RemotionTextClip} track={track} />
              ) : null}
            </Sequence>
          ))}
        </div>
      ))}
    </AbsoluteFill>
  );
};