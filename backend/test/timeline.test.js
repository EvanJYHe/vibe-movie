const test = require("node:test");
const assert = require("node:assert/strict");
const {
  calculateDurationInFrames,
  normalizeTimeline,
  validateTimeline,
} = require("../src/timeline");

test("normalizes editor timelines into frame-accurate data", () => {
  const timeline = normalizeTimeline({
    project: { width: 1280, height: 720, fps: 30 },
    timeline: [
      {
        id: "track-1",
        clips: [
          {
            id: "clip-1",
            type: "video",
            startTime: 1.5,
            duration: 2,
            assetUrl: "video.mp4",
          },
        ],
      },
    ],
  });

  assert.equal(timeline.timeline[0].clips[0].startInFrames, 45);
  assert.equal(timeline.timeline[0].clips[0].durationInFrames, 60);
  assert.equal(calculateDurationInFrames(timeline), 105);
  assert.deepEqual(validateTimeline(timeline), { valid: true, errors: [] });
});

test("rejects invalid clip durations", () => {
  const timeline = normalizeTimeline({ timeline: [{ clips: [{ type: "text" }] }] });
  timeline.timeline[0].clips[0].duration = 0;

  const result = validateTimeline(timeline);
  assert.equal(result.valid, false);
  assert.match(result.errors.join(" "), /duration must be greater than zero/);
});
