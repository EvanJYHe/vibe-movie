import { Player } from '@remotion/player';
import { VideoComposition } from '../remotion/VideoComposition';
import type { VideoTimeline } from '../types/timeline';
import { calculateTotalDuration } from '../utils/timeline';

interface EditorPlayerProps {
  timeline: VideoTimeline;
}

export const EditorPlayer: React.FC<EditorPlayerProps> = ({ timeline }) => {
  const totalDuration = calculateTotalDuration(timeline);

  return (
    <Player
      component={VideoComposition}
      durationInFrames={totalDuration}
      compositionWidth={timeline.project.width}
      compositionHeight={timeline.project.height}
      fps={timeline.project.fps}
      inputProps={{ timeline }}
      style={{
        width: 960,
        height: 540,
      }}
      controls
    />
  );
};