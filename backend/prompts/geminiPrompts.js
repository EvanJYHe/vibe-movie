const {
  DEFAULT_PROJECT,
  normalizeTimeline,
  validateTimeline,
} = require("../src/timeline");

function generatePrompt(userMessage, currentTimeline, hasVideo = false, assets = []) {
  const timeline = normalizeTimeline(
    currentTimeline || { project: DEFAULT_PROJECT, timeline: [] }
  );
  const assetContext = assets.map(({ id, name, type, duration, width, height, url }) => ({
    id,
    name,
    type,
    duration,
    width,
    height,
    assetUrl: url,
  }));

  return `# VibeMovie timeline editor

Edit the supplied video timeline according to the user's instruction. Return a short explanation followed by exactly one complete JSON timeline in a \`\`\`json code block.

## Contract

- Keep the root shape: { "project": { "width", "height", "fps" }, "timeline": Track[] }.
- Every track needs id, name, height, muted, locked, color, and clips.
- Every clip needs id, trackId, type, startTime, duration, startInFrames, durationInFrames, name, color, and selected.
- type must be one of video, audio, image, or text.
- At ${timeline.project.fps} fps, keep seconds and frame values consistent.
- Text clips need text and style. Media clips must reuse assetId and assetUrl from the available assets.
- Preserve existing content unless the user explicitly asks to remove it.
- Do not invent asset URLs. Do not return comments inside the JSON.

## Current timeline

${JSON.stringify(timeline, null, 2)}

## Available assets

${assetContext.length ? JSON.stringify(assetContext, null, 2) : "No imported assets."}

## Attached video

${hasVideo ? "A video is attached for visual context." : "No video is attached."}

## User instruction

${userMessage}`;
}

function jsonCandidates(responseText) {
  const candidates = [];
  const blockPattern = /```(?:json)?\s*([\s\S]*?)```/gi;
  let match;

  while ((match = blockPattern.exec(responseText)) !== null) {
    candidates.push(match[1].trim());
  }

  const firstBrace = responseText.indexOf("{");
  const lastBrace = responseText.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    candidates.push(responseText.slice(firstBrace, lastBrace + 1));
  }

  return candidates;
}

function parseTimelineFromResponse(responseText) {
  for (const candidate of jsonCandidates(responseText)) {
    try {
      const timeline = normalizeTimeline(JSON.parse(candidate));
      const validation = validateTimeline(timeline);
      if (validation.valid) return timeline;
      console.warn(`Gemini returned an invalid timeline: ${validation.errors.join(" ")}`);
    } catch {
      // Try the next candidate; prose around model output is expected.
    }
  }
  return null;
}

function cleanResponseText(responseText) {
  return responseText.replace(/```(?:json)?[\s\S]*?```/gi, "").trim();
}

module.exports = { cleanResponseText, generatePrompt, parseTimelineFromResponse };
