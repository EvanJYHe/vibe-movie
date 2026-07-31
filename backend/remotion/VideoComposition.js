const React = require("react");
const {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  Video,
  useCurrentFrame,
} = require("remotion");

function effectProgress(effect, localFrame, clipDuration) {
  if (effect.type === "fade-out") {
    const start = clipDuration - effect.durationInFrames;
    return localFrame < start
      ? 0
      : (localFrame - start) / effect.durationInFrames;
  }
  return Math.min(1, localFrame / effect.durationInFrames);
}

function clipOpacity(clip, frame) {
  const localFrame = frame - clip.startInFrames;
  let opacity = clip.opacity ?? 1;

  for (const effect of Array.isArray(clip.effects) ? clip.effects : []) {
    if (!effect || effect.durationInFrames <= 0) continue;
    const progress = effectProgress(effect, localFrame, clip.durationInFrames);
    if (effect.type === "fade-in" && localFrame < effect.durationInFrames) {
      opacity = Math.min(opacity, progress);
    }
    if (
      effect.type === "fade-out" &&
      localFrame >= clip.durationInFrames - effect.durationInFrames
    ) {
      opacity = Math.min(opacity, 1 - progress);
    }
  }

  return Math.max(0, Math.min(1, opacity));
}

function MediaClip({ clip, track, fps }) {
  const frame = useCurrentFrame();
  if (!clip.assetUrl) return null;

  const startFrom = Math.max(0, Math.floor((clip.trimStart ?? 0) * fps));
  const endAt = Math.max(
    startFrom + 1,
    Math.ceil(((clip.trimStart ?? 0) + clip.duration) * fps)
  );
  const muted = Boolean(track.muted || clip.muted);
  const opacity = clipOpacity(clip, frame);

  if (clip.type === "audio") {
    return React.createElement(Audio, {
      src: clip.assetUrl,
      startFrom,
      endAt,
      muted,
      volume: clip.volume ?? 1,
    });
  }

  return React.createElement(
    "div",
    {
      style: {
        alignItems: "center",
        backgroundColor: "black",
        display: "flex",
        height: "100%",
        justifyContent: "center",
        opacity,
        width: "100%",
      },
    },
    React.createElement(Video, {
      src: clip.assetUrl,
      startFrom,
      endAt,
      muted,
      volume: clip.volume ?? 1,
      style: { height: "100%", objectFit: "contain", width: "100%" },
    })
  );
}

function ImageClip({ clip }) {
  const frame = useCurrentFrame();
  if (!clip.assetUrl) return null;

  const position = clip.position || { x: 0.5, y: 0.5 };
  const unit = position.unit || "%";
  const x = unit === "%" ? position.x : position.x;
  const y = unit === "%" ? position.y : position.y;
  const normalizedX = unit === "%" && x <= 1 ? x * 100 : x;
  const normalizedY = unit === "%" && y <= 1 ? y * 100 : y;

  return React.createElement(
    "div",
    {
      style: {
        alignItems: "center",
        display: "flex",
        height: "100%",
        justifyContent: "center",
        left: `${normalizedX}${unit}`,
        opacity: clipOpacity(clip, frame),
        position: "absolute",
        top: `${normalizedY}${unit}`,
        transform: `translate(-50%, -50%) scale(${clip.scale ?? 1}) rotate(${clip.rotation ?? 0}deg)`,
        width: "100%",
      },
    },
    React.createElement(Img, {
      src: clip.assetUrl,
      style: { maxHeight: "100%", maxWidth: "100%", objectFit: "contain" },
    })
  );
}

function TextClip({ clip }) {
  const frame = useCurrentFrame();
  const localFrame = frame - clip.startInFrames;
  let transform = "translate(-50%, -50%)";

  for (const effect of Array.isArray(clip.effects) ? clip.effects : []) {
    if (
      effect?.type === "slide-in" &&
      effect.direction === "from-bottom" &&
      localFrame < effect.durationInFrames
    ) {
      const progress = effectProgress(effect, localFrame, clip.durationInFrames);
      transform = `translate(-50%, calc(-50% + ${(1 - progress) * 100}px))`;
    }
  }

  return React.createElement(
    "div",
    {
      style: {
        color: clip.style?.color || "white",
        fontFamily: clip.style?.fontFamily || "Arial, sans-serif",
        fontSize: clip.style?.fontSize || 48,
        fontWeight: clip.style?.fontWeight || "bold",
        left: "50%",
        opacity: clipOpacity(clip, frame),
        position: "absolute",
        textAlign: "center",
        textShadow: clip.style?.textShadow || "2px 2px 4px rgba(0,0,0,0.5)",
        top: "50%",
        transform,
        whiteSpace: "nowrap",
      },
    },
    clip.text || clip.name
  );
}

function VideoComposition({ timeline }) {
  const fps = timeline.project?.fps || 30;

  return React.createElement(
    AbsoluteFill,
    { style: { backgroundColor: "black" } },
    timeline.timeline.flatMap((track) =>
      track.clips.map((clip) =>
        React.createElement(
          Sequence,
          {
            durationInFrames: clip.durationInFrames,
            from: clip.startInFrames,
            key: clip.id,
          },
          clip.type === "text"
            ? React.createElement(TextClip, { clip })
            : clip.type === "image"
              ? React.createElement(ImageClip, { clip })
              : React.createElement(MediaClip, { clip, fps, track })
        )
      )
    )
  );
}

module.exports = { VideoComposition };
