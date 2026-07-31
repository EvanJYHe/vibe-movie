const test = require("node:test");
const assert = require("node:assert/strict");
const {
  cleanResponseText,
  parseTimelineFromResponse,
} = require("../prompts/geminiPrompts");

const response = `I tightened the opening.\n\n\`\`\`json
{
  "project": { "width": 1920, "height": 1080, "fps": 30 },
  "timeline": [{
    "id": "track-1",
    "clips": [{
      "id": "title-1",
      "type": "text",
      "text": "Opening",
      "startTime": 0,
      "duration": 2
    }]
  }]
}
\`\`\``;

test("extracts and normalizes a timeline from Gemini output", () => {
  const timeline = parseTimelineFromResponse(response);
  assert.ok(timeline);
  assert.equal(timeline.timeline[0].clips[0].durationInFrames, 60);
  assert.equal(timeline.timeline[0].clips[0].trackId, "track-1");
});

test("removes structured JSON from the human-facing response", () => {
  assert.equal(cleanResponseText(response), "I tightened the opening.");
});
