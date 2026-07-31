import { forwardRef } from "react";
import { Player, type PlayerRef } from "@remotion/player";
import { VideoComposition } from "../remotion/VideoComposition";
import type { VideoTimeline } from "../types/timeline";

interface RemotionProgramPlayerProps {
  durationInFrames: number;
  initialFrame: number;
  timeline: VideoTimeline;
}

export const RemotionProgramPlayer = forwardRef<
  PlayerRef,
  RemotionProgramPlayerProps
>(function RemotionProgramPlayer(
  { durationInFrames, initialFrame, timeline },
  ref
) {
  return (
    <Player
      acknowledgeRemotionLicense
      className="video-preview-player"
      clickToPlay={false}
      component={VideoComposition}
      compositionHeight={1080}
      compositionWidth={1920}
      controls={false}
      durationInFrames={durationInFrames}
      fps={30}
      initialFrame={initialFrame}
      inputProps={{ timeline }}
      loop={false}
      ref={ref}
      showPosterWhenPaused={false}
      showPosterWhenUnplayed={false}
      showVolumeControls={false}
      style={{ width: "100%", height: "100%" }}
    />
  );
});
