import { Sequence, Video, useCurrentFrame, AbsoluteFill } from 'remotion';
import type { VideoTimeline, Track, VideoClip, TextClip } from '../types/timeline';
import { getClipLocalFrame, isEffectActive, getEffectProgress } from '../utils/timeline';
import { calculatePosition } from '../utils/positioning';

interface VideoCompositionProps {
  timeline: VideoTimeline;
}

const VideoClipComponent: React.FC<{ clip: VideoClip; track: Track }> = ({ clip }) => {
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
        onError={handleVideoError}
        muted={true}
      />
    </div>
  );
};

const TextClipComponent: React.FC<{ clip: TextClip; track: Track }> = ({ clip }) => {
  const frame = useCurrentFrame();
  const localFrame = getClipLocalFrame(clip, frame);

  let opacity = 1;
  const positionData = calculatePosition(clip.position, clip.layout);
  let transform = positionData.transform;

  if (clip.effects) {
    clip.effects.forEach((effect) => {
      if (isEffectActive(effect, localFrame, clip.durationInFrames)) {
        const progress = getEffectProgress(effect, localFrame, clip.durationInFrames);

        if (effect.type === 'fade-in') {
          opacity = Math.min(opacity, progress);
        } else if (effect.type === 'fade-out') {
          opacity = Math.min(opacity, 1 - progress);
        } else if (effect.type === 'slide-in') {
          let slideTransform = '';
          const slideDistance = 100;

          switch (effect.direction) {
            case 'from-bottom':
              slideTransform = ` translateY(${(1 - progress) * slideDistance}px)`;
              break;
            case 'from-top':
              slideTransform = ` translateY(${-(1 - progress) * slideDistance}px)`;
              break;
            case 'from-left':
              slideTransform = ` translateX(${-(1 - progress) * slideDistance}px)`;
              break;
            case 'from-right':
              slideTransform = ` translateX(${(1 - progress) * slideDistance}px)`;
              break;
          }

          transform = positionData.transform + slideTransform;
        }
      }
    });
  }

  const textStyle = {
    fontFamily: clip.style.fontFamily,
    fontSize: clip.style.fontSize,
    fontWeight: clip.style.fontWeight,
    color: clip.style.color,
    textShadow: clip.style.textShadow || '2px 2px 4px rgba(0,0,0,0.5)',
    letterSpacing: clip.style.letterSpacing,
    textTransform: clip.style.textTransform,
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: positionData.top,
        left: positionData.left,
        transform,
        opacity,
        textAlign: positionData.textAlign,
        maxWidth: positionData.maxWidth,
        wordBreak: positionData.wordWrap === 'break-word' ? 'break-word' : 'normal',
        lineHeight: positionData.lineHeight,
        whiteSpace: positionData.wordWrap === 'nowrap' ? 'nowrap' : 'normal',
        ...textStyle,
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
                <VideoClipComponent clip={clip as VideoClip} track={track} />
              ) : track.type === 'text' ? (
                <TextClipComponent clip={clip as TextClip} track={track} />
              ) : null}
            </Sequence>
          ))}
        </div>
      ))}
    </AbsoluteFill>
  );
};