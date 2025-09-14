import { Composition, registerRoot } from 'remotion';
import { VideoComposition } from './VideoComposition';
import timelineData from '../data/timeline.json';
import type { VideoTimeline } from '../types/timeline';
import { calculateTotalDuration } from '../utils/timeline';

const timeline: VideoTimeline = timelineData as VideoTimeline;
const totalDuration = calculateTotalDuration(timeline);

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="VideoComposition"
        component={VideoComposition as any}
        durationInFrames={totalDuration}
        fps={timeline.project.fps}
        width={timeline.project.width}
        height={timeline.project.height}
        defaultProps={{ timeline }}
      />
    </>
  );
};

registerRoot(RemotionRoot);