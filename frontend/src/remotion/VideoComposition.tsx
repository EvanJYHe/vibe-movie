import { Sequence, Video, useCurrentFrame, AbsoluteFill } from 'remotion';
<<<<<<< HEAD
import type { VideoTimeline, RemotionTrack, RemotionVideoClip, RemotionTextClip } from '../types/timeline';
import { getClipLocalFrame, isEffectActive, getEffectProgress } from '../utils/timeline';
=======
import type { VideoTimeline, Track, VideoClip, TextClip } from '../types/timeline';
import { getClipLocalFrame, isEffectActive, getEffectProgress } from '../utils/timeline';
import { calculatePosition } from '../utils/positioning';
>>>>>>> better-prompting

interface VideoCompositionProps {
  timeline: VideoTimeline;
}

<<<<<<< HEAD
const VideoClipComponent: React.FC<{ clip: RemotionVideoClip; track: RemotionTrack }> = ({ clip }) => {
=======
const VideoClipComponent: React.FC<{ clip: VideoClip; track: Track }> = ({ clip }) => {
>>>>>>> better-prompting
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
<<<<<<< HEAD
        startFrom={clip.sourceIn || 0}
        endAt={clip.sourceOut}
=======
>>>>>>> better-prompting
        onError={handleVideoError}
        muted={true}
      />
    </div>
  );
};

<<<<<<< HEAD
const TextClipComponent: React.FC<{ clip: RemotionTextClip; track: RemotionTrack }> = ({ clip }) => {
=======
const TextClipComponent: React.FC<{ clip: TextClip; track: Track }> = ({ clip }) => {
>>>>>>> better-prompting
  const frame = useCurrentFrame();
  const localFrame = getClipLocalFrame(clip, frame);

  let opacity = 1;
<<<<<<< HEAD
  let transform = 'translate(-50%, -50%)';
=======
  const positionData = calculatePosition(clip.position, clip.layout);
  let transform = positionData.transform;
>>>>>>> better-prompting

  if (clip.effects) {
    clip.effects.forEach((effect) => {
      if (isEffectActive(effect, localFrame, clip.durationInFrames)) {
        const progress = getEffectProgress(effect, localFrame, clip.durationInFrames);

        if (effect.type === 'fade-in') {
          opacity = Math.min(opacity, progress);
        } else if (effect.type === 'fade-out') {
          opacity = Math.min(opacity, 1 - progress);
<<<<<<< HEAD
        } else if (effect.type === 'slide-in' && effect.direction === 'from-bottom') {
          const translateY = (1 - progress) * 100;
          transform = `translate(-50%, calc(-50% + ${translateY}px))`;
=======
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
>>>>>>> better-prompting
        }
      }
    });
  }

<<<<<<< HEAD
=======
  const textStyle = {
    fontFamily: clip.style.fontFamily,
    fontSize: clip.style.fontSize,
    fontWeight: clip.style.fontWeight,
    color: clip.style.color,
    textShadow: clip.style.textShadow || '2px 2px 4px rgba(0,0,0,0.5)',
    letterSpacing: clip.style.letterSpacing,
    textTransform: clip.style.textTransform,
  };

>>>>>>> better-prompting
  return (
    <div
      style={{
        position: 'absolute',
<<<<<<< HEAD
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
=======
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
>>>>>>> better-prompting
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
<<<<<<< HEAD
                <VideoClipComponent clip={clip as RemotionVideoClip} track={track} />
              ) : track.type === 'text' ? (
                <TextClipComponent clip={clip as RemotionTextClip} track={track} />
=======
                <VideoClipComponent clip={clip as VideoClip} track={track} />
              ) : track.type === 'text' ? (
                <TextClipComponent clip={clip as TextClip} track={track} />
>>>>>>> better-prompting
              ) : null}
            </Sequence>
          ))}
        </div>
      ))}
    </AbsoluteFill>
  );
};