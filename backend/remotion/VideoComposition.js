const React = require('react');
const { Sequence, Video, useCurrentFrame, AbsoluteFill } = require('remotion');

// Helper functions for effects and timing
const getClipLocalFrame = (clip, globalFrame) => {
  return globalFrame - clip.startInFrames;
};

const isEffectActive = (effect, localFrame, clipDuration) => {
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

const getEffectProgress = (effect, localFrame, clipDuration) => {
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

const VideoClipComponent = ({ clip }) => {
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

  return React.createElement('div', 
    { style: { opacity } },
    React.createElement(Video, {
      src: clip.assetUrl,
      style: { width: '100%', height: '100%' },
      startFrom: clip.sourceIn || 0,
      endAt: clip.sourceOut,
      muted: true
    })
  );
};

const TextClipComponent = ({ clip }) => {
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

  return React.createElement('div', {
    style: {
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
    }
  }, clip.text);
};

const VideoComposition = ({ timeline }) => {
  return React.createElement(AbsoluteFill, 
    { style: { backgroundColor: 'black' } },
    timeline.timeline.map((track) =>
      React.createElement('div', 
        { key: track.id },
        track.clips.map((clip) =>
          React.createElement(Sequence, {
            key: clip.id,
            from: clip.startInFrames,
            durationInFrames: clip.durationInFrames
          },
          track.type === 'video' 
            ? React.createElement(VideoClipComponent, { clip, track })
            : track.type === 'text' 
            ? React.createElement(TextClipComponent, { clip, track })
            : null
          )
        )
      )
    )
  );
};

module.exports = { VideoComposition };