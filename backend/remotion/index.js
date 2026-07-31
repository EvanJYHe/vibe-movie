const React = require("react");
const { Composition, registerRoot } = require("remotion");
const { calculateDurationInFrames, DEFAULT_PROJECT } = require("../src/timeline");
const { VideoComposition } = require("./VideoComposition");

const emptyTimeline = { project: DEFAULT_PROJECT, timeline: [] };

function RemotionRoot() {
  return React.createElement(Composition, {
    id: "VideoExport",
    component: VideoComposition,
    defaultProps: { timeline: emptyTimeline },
    durationInFrames: 1,
    fps: DEFAULT_PROJECT.fps,
    width: DEFAULT_PROJECT.width,
    height: DEFAULT_PROJECT.height,
    calculateMetadata: ({ props }) => ({
      durationInFrames: calculateDurationInFrames(props.timeline),
      fps: props.timeline.project.fps,
      width: props.timeline.project.width,
      height: props.timeline.project.height,
    }),
  });
}

registerRoot(RemotionRoot);
