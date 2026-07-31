import type { CSSProperties } from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  Video,
  useCurrentFrame,
} from "remotion";
import type { Clip, Track, VideoTimeline } from "../types/timeline";
import {
  getClipLocalFrame,
  getEffectProgress,
  isEffectActive,
} from "../utils/timeline";

export interface VideoCompositionProps extends Record<string, unknown> {
  timeline: VideoTimeline;
}

function getOpacity(clip: Clip, frame: number) {
  const localFrame = getClipLocalFrame(clip, frame);
  let opacity = clip.opacity ?? 1;

  for (const effect of clip.effects ?? []) {
    if (!isEffectActive(effect, localFrame, clip.durationInFrames)) continue;
    const progress = getEffectProgress(effect, localFrame, clip.durationInFrames);
    if (effect.type === "fade-in") opacity = Math.min(opacity, progress);
    if (effect.type === "fade-out") opacity = Math.min(opacity, 1 - progress);
  }

  return Math.max(0, Math.min(1, opacity));
}

function MediaClip({ clip, fps, track }: { clip: Clip; fps: number; track: Track }) {
  const frame = useCurrentFrame();
  if (!clip.assetUrl) return null;

  const startFrom = Math.max(0, Math.floor((clip.trimStart ?? 0) * fps));
  const endAt = Math.max(
    startFrom + 1,
    Math.ceil(((clip.trimStart ?? 0) + clip.duration) * fps)
  );
  const muted = Boolean(track.muted || clip.muted);

  if (clip.type === "audio") {
    return (
      <Audio
        endAt={endAt}
        muted={muted}
        src={clip.assetUrl}
        startFrom={startFrom}
        volume={clip.volume ?? 1}
      />
    );
  }

  return (
    <div
      style={{
        alignItems: "center",
        backgroundColor: "black",
        display: "flex",
        height: "100%",
        justifyContent: "center",
        opacity: getOpacity(clip, frame),
        width: "100%",
      }}
    >
      <Video
        endAt={endAt}
        muted={muted}
        src={clip.assetUrl}
        startFrom={startFrom}
        style={{ height: "100%", objectFit: "contain", width: "100%" }}
        volume={clip.volume ?? 1}
      />
    </div>
  );
}

function TextClip({ clip }: { clip: Clip }) {
  const frame = useCurrentFrame();
  const localFrame = getClipLocalFrame(clip, frame);
  let transform = "translate(-50%, -50%)";

  for (const effect of clip.effects ?? []) {
    if (
      effect.type === "slide-in" &&
      effect.direction === "from-bottom" &&
      isEffectActive(effect, localFrame, clip.durationInFrames)
    ) {
      const progress = getEffectProgress(effect, localFrame, clip.durationInFrames);
      transform = `translate(-50%, calc(-50% + ${(1 - progress) * 100}px))`;
    }
  }

  return (
    <div
      style={{
        color: clip.style?.color || "white",
        fontFamily: clip.style?.fontFamily || "Arial, sans-serif",
        fontSize: clip.style?.fontSize || 48,
        fontWeight: clip.style?.fontWeight || "bold",
        left: "50%",
        opacity: getOpacity(clip, frame),
        position: "absolute",
        textAlign: "center",
        textShadow: clip.style?.textShadow || "2px 2px 4px rgba(0,0,0,0.5)",
        top: "50%",
        transform,
        whiteSpace: "nowrap",
      }}
    >
      {clip.text || clip.name}
    </div>
  );
}

function ImageClip({ clip }: { clip: Clip }) {
  const frame = useCurrentFrame();
  if (!clip.assetUrl) return null;

  const position = clip.position || { x: 0.5, y: 0.5, unit: "%" as const };
  const unit = position.unit || "%";
  const x = unit === "%" && position.x <= 1 ? position.x * 100 : position.x;
  const y = unit === "%" && position.y <= 1 ? position.y * 100 : position.y;
  const style: CSSProperties = {
    alignItems: "center",
    display: "flex",
    height: "100%",
    justifyContent: "center",
    left: `${x}${unit}`,
    opacity: getOpacity(clip, frame),
    position: "absolute",
    top: `${y}${unit}`,
    transform: `translate(-50%, -50%) scale(${clip.scale ?? 1}) rotate(${clip.rotation ?? 0}deg)`,
    width: "100%",
  };

  return (
    <div style={style}>
      <Img
        src={clip.assetUrl}
        style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }}
      />
    </div>
  );
}

export function VideoComposition({ timeline }: VideoCompositionProps) {
  const fps = timeline.project?.fps || 30;

  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      {timeline.timeline.flatMap((track) =>
        track.clips.map((clip) => (
          <Sequence
            durationInFrames={clip.durationInFrames}
            from={clip.startInFrames}
            key={clip.id}
          >
            {clip.type === "text" ? (
              <TextClip clip={clip} />
            ) : clip.type === "image" ? (
              <ImageClip clip={clip} />
            ) : (
              <MediaClip clip={clip} fps={fps} track={track} />
            )}
          </Sequence>
        ))
      )}
    </AbsoluteFill>
  );
}
