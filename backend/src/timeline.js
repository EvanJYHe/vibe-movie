const DEFAULT_PROJECT = Object.freeze({ width: 1920, height: 1080, fps: 30 });
const CLIP_TYPES = new Set(["video", "audio", "image", "text"]);

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function finiteNumber(value, fallback) {
  return Number.isFinite(Number(value)) ? Number(value) : fallback;
}

function inferClipType(clip) {
  if (CLIP_TYPES.has(clip.type)) return clip.type;
  if (typeof clip.text === "string" && !clip.assetUrl) return "text";
  if (/\.(?:jpe?g|png|gif|webp|svg)(?:\?.*)?$/i.test(clip.assetUrl || "")) {
    return "image";
  }
  if (/\.(?:mp3|wav|ogg|aac|m4a)(?:\?.*)?$/i.test(clip.assetUrl || "")) {
    return "audio";
  }
  return "video";
}

function normalizeTimeline(input) {
  const source = isRecord(input) ? input : {};
  const projectSource = isRecord(source.project) ? source.project : {};
  const fps = Math.max(1, finiteNumber(projectSource.fps, DEFAULT_PROJECT.fps));
  const tracks = Array.isArray(source.timeline) ? source.timeline : [];

  return {
    project: {
      width: Math.max(1, finiteNumber(projectSource.width, DEFAULT_PROJECT.width)),
      height: Math.max(1, finiteNumber(projectSource.height, DEFAULT_PROJECT.height)),
      fps,
    },
    timeline: tracks.map((trackValue, trackIndex) => {
      const track = isRecord(trackValue) ? trackValue : {};
      const trackId =
        typeof track.id === "string" && track.id ? track.id : `track-${trackIndex + 1}`;
      const clips = Array.isArray(track.clips) ? track.clips : [];

      return {
        ...track,
        id: trackId,
        name:
          typeof track.name === "string" && track.name
            ? track.name
            : `Track ${trackIndex + 1}`,
        height: Math.max(40, finiteNumber(track.height, 80)),
        muted: Boolean(track.muted),
        locked: Boolean(track.locked),
        color: typeof track.color === "string" ? track.color : "#666666",
        clips: clips.map((clipValue, clipIndex) => {
          const clip = isRecord(clipValue) ? clipValue : {};
          const type = inferClipType(clip);
          const startTime = Math.max(
            0,
            finiteNumber(
              clip.startTime,
              finiteNumber(clip.startInFrames, 0) / fps
            )
          );
          const duration = Math.max(
            1 / fps,
            finiteNumber(
              clip.duration,
              finiteNumber(clip.durationInFrames, 1) / fps
            )
          );

          return {
            ...clip,
            id:
              typeof clip.id === "string" && clip.id
                ? clip.id
                : `${trackId}-clip-${clipIndex + 1}`,
            trackId,
            type,
            startTime,
            duration,
            startInFrames: Math.max(0, Math.round(startTime * fps)),
            durationInFrames: Math.max(1, Math.round(duration * fps)),
            name:
              typeof clip.name === "string" && clip.name
                ? clip.name
                : type === "text"
                  ? clip.text || "Text"
                  : `Clip ${clipIndex + 1}`,
            color:
              typeof clip.color === "string"
                ? clip.color
                : type === "text"
                  ? "#00FF00"
                  : "#0080FF",
            selected: false,
          };
        }),
      };
    }),
  };
}

function validateTimeline(value) {
  const errors = [];

  if (!isRecord(value)) {
    return { valid: false, errors: ["Timeline must be an object."] };
  }
  if (!isRecord(value.project)) errors.push("project must be an object.");
  if (!Array.isArray(value.timeline)) {
    errors.push("timeline must be an array.");
    return { valid: false, errors };
  }

  value.timeline.forEach((track, trackIndex) => {
    if (!isRecord(track)) {
      errors.push(`timeline[${trackIndex}] must be an object.`);
      return;
    }
    if (!Array.isArray(track.clips)) {
      errors.push(`timeline[${trackIndex}].clips must be an array.`);
      return;
    }

    track.clips.forEach((clip, clipIndex) => {
      const prefix = `timeline[${trackIndex}].clips[${clipIndex}]`;
      if (!isRecord(clip)) {
        errors.push(`${prefix} must be an object.`);
        return;
      }
      if (!CLIP_TYPES.has(clip.type)) errors.push(`${prefix}.type is invalid.`);
      if (!Number.isFinite(clip.startTime) || clip.startTime < 0) {
        errors.push(`${prefix}.startTime must be zero or greater.`);
      }
      if (!Number.isFinite(clip.duration) || clip.duration <= 0) {
        errors.push(`${prefix}.duration must be greater than zero.`);
      }
      if (!Number.isInteger(clip.startInFrames) || clip.startInFrames < 0) {
        errors.push(`${prefix}.startInFrames must be a non-negative integer.`);
      }
      if (!Number.isInteger(clip.durationInFrames) || clip.durationInFrames < 1) {
        errors.push(`${prefix}.durationInFrames must be a positive integer.`);
      }
      if (clip.type === "text" && typeof clip.text !== "string") {
        errors.push(`${prefix}.text is required for text clips.`);
      }
    });
  });

  return { valid: errors.length === 0, errors };
}

function calculateDurationInFrames(timeline) {
  const maxEndFrame = timeline.timeline.reduce(
    (timelineEnd, track) =>
      Math.max(
        timelineEnd,
        ...track.clips.map(
          (clip) => clip.startInFrames + clip.durationInFrames
        )
      ),
    0
  );
  return Math.max(1, maxEndFrame);
}

module.exports = {
  DEFAULT_PROJECT,
  calculateDurationInFrames,
  normalizeTimeline,
  validateTimeline,
};
