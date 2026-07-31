import type { Clip, Track } from "../../types/timeline";
import { createId } from "../../utils/id";

interface AIClip extends Partial<Clip> {
  sourceIn?: number;
  sourceOut?: number;
  scene?: string;
  tags?: string[];
}

interface AITrack extends Omit<Partial<Track>, "clips"> {
  clips?: AIClip[];
}

interface AITimeline {
  timeline?: AITrack[];
  project?: { fps?: number };
}

function inferType(clip: AIClip): Clip["type"] {
  if (["video", "audio", "image", "text"].includes(clip.type || "")) {
    return clip.type as Clip["type"];
  }
  if (clip.text && !clip.assetUrl) return "text";
  if (/\.(?:jpe?g|png|gif|webp|svg)(?:\?.*)?$/i.test(clip.assetUrl || "")) {
    return "image";
  }
  if (/\.(?:mp3|wav|ogg|aac|m4a)(?:\?.*)?$/i.test(clip.assetUrl || "")) {
    return "audio";
  }
  return "video";
}

export function adaptAITimeline(input: unknown): Track[] | null {
  const timeline = input as AITimeline;
  if (!Array.isArray(timeline?.timeline)) return null;

  const fps = Math.max(1, Number(timeline.project?.fps) || 30);
  return timeline.timeline.map((sourceTrack, trackIndex) => {
    const trackId = sourceTrack.id || `ai-track-${trackIndex + 1}`;
    const clips = (sourceTrack.clips || []).map((sourceClip, clipIndex) => {
      const type = inferType(sourceClip);
      const startTime = Math.max(
        0,
        Number.isFinite(sourceClip.startTime)
          ? Number(sourceClip.startTime)
          : Number(sourceClip.startInFrames || 0) / fps
      );
      const duration = Math.max(
        1 / fps,
        Number.isFinite(sourceClip.duration)
          ? Number(sourceClip.duration)
          : Number(sourceClip.durationInFrames || 1) / fps
      );

      return {
        ...sourceClip,
        id: createId(sourceClip.id || `ai-clip-${clipIndex + 1}`),
        trackId,
        type,
        startTime,
        duration,
        startInFrames: Math.max(0, Math.round(startTime * fps)),
        durationInFrames: Math.max(1, Math.round(duration * fps)),
        assetId: sourceClip.assetId,
        assetUrl: sourceClip.assetUrl,
        trimStart:
          sourceClip.trimStart ??
          (Number.isFinite(sourceClip.sourceIn)
            ? Number(sourceClip.sourceIn) / fps
            : 0),
        trimEnd: sourceClip.trimEnd ?? 0,
        volume: sourceClip.volume,
        muted: sourceClip.muted,
        text: sourceClip.text,
        style:
          type === "text"
            ? {
                fontFamily: "Arial, sans-serif",
                fontSize: 48,
                fontWeight: "bold",
                color: "#FFFFFF",
                ...sourceClip.style,
              }
            : sourceClip.style,
        name:
          sourceClip.name ||
          sourceClip.text ||
          sourceClip.assetUrl?.split("/").pop()?.split("?")[0] ||
          `AI Clip ${clipIndex + 1}`,
        color: sourceClip.color || (type === "text" ? "#00FF00" : "#0080FF"),
        selected: false,
        metadata: {
          ...sourceClip.metadata,
          transcript: sourceClip.metadata?.transcript || sourceClip.text,
          scene: sourceClip.metadata?.scene || sourceClip.scene,
          tags: sourceClip.metadata?.tags || sourceClip.tags,
        },
      } satisfies Clip;
    });

    return {
      id: trackId,
      name: sourceTrack.name || `AI Track ${trackIndex + 1}`,
      height: sourceTrack.height || 80,
      muted: Boolean(sourceTrack.muted),
      locked: Boolean(sourceTrack.locked),
      color: sourceTrack.color || "#666666",
      type: sourceTrack.type,
      clips,
    } satisfies Track;
  });
}
