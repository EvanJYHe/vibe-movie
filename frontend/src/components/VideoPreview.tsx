import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { PlayerRef } from "@remotion/player";
import { useShallow } from "zustand/react/shallow";
import { useTimelineStore } from "../stores/timelineStore";
import { convertTimelineToRemotionFormat } from "../utils/timeline";
import { StudioIcon } from "./StudioIcon";
import "./VideoPreview.css";

const FPS = 30;

const RemotionProgramPlayer = lazy(() =>
  import("./RemotionProgramPlayer").then(
    ({ RemotionProgramPlayer: Component }) => ({
      default: Component,
    })
  )
);

export function VideoPreview() {
  const { tracks, playheadPosition, duration, assets, setPlayheadPosition } =
    useTimelineStore(
      useShallow((state) => ({
        tracks: state.tracks,
        playheadPosition: state.playheadPosition,
        duration: state.duration,
        assets: state.assets,
        setPlayheadPosition: state.setPlayheadPosition,
      }))
    );
  const playerRef = useRef<PlayerRef>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [guidesVisible, setGuidesVisible] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const remotionTimeline = useMemo(
    () => convertTimelineToRemotionFormat(tracks, assets),
    [tracks, assets]
  );

  const hasContent = useMemo(
    () => remotionTimeline.timeline.some((track) => track.clips.length > 0),
    [remotionTimeline]
  );

  const totalDurationInFrames = Math.max(1, Math.floor(duration * FPS));
  const currentFrame = Math.min(
    totalDurationInFrames - 1,
    Math.floor(playheadPosition * FPS)
  );

  useEffect(() => {
    if (playerRef.current && !isPlaying) {
      playerRef.current.seekTo(currentFrame);
    }
  }, [currentFrame, isPlaying]);

  const togglePlayPause = useCallback(() => {
    if (!playerRef.current || !hasContent) return;

    if (isPlaying) {
      playerRef.current.pause();
      setIsPlaying(false);
    } else {
      if (playheadPosition >= duration - 1 / FPS) {
        playerRef.current.seekTo(0);
        setPlayheadPosition(0);
      }
      playerRef.current.play();
      setIsPlaying(true);
    }
  }, [
    duration,
    hasContent,
    isPlaying,
    playheadPosition,
    setPlayheadPosition,
  ]);

  useEffect(() => {
    if (!isPlaying) return;

    const interval = window.setInterval(() => {
      const frame = playerRef.current?.getCurrentFrame() ?? 0;
      const nextTime = frame / FPS;
      setPlayheadPosition(nextTime);
      if (nextTime >= duration - 1 / FPS) {
        playerRef.current?.pause();
        setIsPlaying(false);
      }
    }, 1000 / FPS);

    return () => window.clearInterval(interval);
  }, [duration, isPlaying, setPlayheadPosition]);

  const stepFrame = (direction: -1 | 1) => {
    const nextFrame = Math.max(
      0,
      Math.min(totalDurationInFrames - 1, currentFrame + direction)
    );
    playerRef.current?.seekTo(nextFrame);
    setPlayheadPosition(nextFrame / FPS);
  };

  const toggleMute = () => {
    if (!playerRef.current) return;
    if (isMuted) {
      playerRef.current.unmute();
      setIsMuted(false);
    } else {
      playerRef.current.mute();
      setIsMuted(true);
    }
  };

  return (
    <section className="program-viewer" aria-label="Program viewer">
      <div className="program-viewer__canvas">
        <div
          className="program-frame"
          data-guides={guidesVisible}
          data-has-content={hasContent}
        >
          {hasContent ? (
            <Suspense fallback={null}>
              <RemotionProgramPlayer
                durationInFrames={totalDurationInFrames}
                initialFrame={currentFrame}
                ref={playerRef}
                timeline={remotionTimeline}
              />
            </Suspense>
          ) : (
            <div className="program-empty">
              <div className="program-empty__reticle" aria-hidden="true">
                <StudioIcon name="video" size={24} />
              </div>
              <div>
                <h2>Import media to begin</h2>
              </div>
            </div>
          )}

          <div className="safe-guides" aria-hidden="true">
            <span />
          </div>
        </div>
      </div>

      <footer className="program-viewer__transport">
        <button
          aria-label="Toggle safe guides"
          aria-pressed={guidesVisible}
          className="viewer-control viewer-control--guides"
          onClick={() => setGuidesVisible((visible) => !visible)}
          title="Safe guides"
          type="button"
        >
          <StudioIcon name="guides" size={14} />
        </button>
        <button
          aria-label="Previous frame"
          className="viewer-control"
          disabled={!hasContent}
          onClick={() => stepFrame(-1)}
          title="Previous frame"
          type="button"
        >
          <StudioIcon name="skipBack" />
        </button>
        <button
          aria-label={isPlaying ? "Pause" : "Play"}
          className="viewer-control viewer-control--play"
          disabled={!hasContent}
          onClick={togglePlayPause}
          title={isPlaying ? "Pause" : "Play"}
          type="button"
        >
          <StudioIcon name={isPlaying ? "pause" : "play"} />
        </button>
        <button
          aria-label="Next frame"
          className="viewer-control"
          disabled={!hasContent}
          onClick={() => stepFrame(1)}
          title="Next frame"
          type="button"
        >
          <StudioIcon name="skipForward" />
        </button>
        <button
          aria-label={isMuted ? "Unmute" : "Mute"}
          aria-pressed={isMuted}
          className="viewer-control viewer-control--secondary"
          disabled={!hasContent}
          onClick={toggleMute}
          title={isMuted ? "Unmute" : "Mute"}
          type="button"
        >
          <StudioIcon name={isMuted ? "mute" : "volume"} />
        </button>
        <button
          aria-label="Full screen"
          className="viewer-control viewer-control--secondary"
          disabled={!hasContent}
          onClick={() => playerRef.current?.requestFullscreen()}
          title="Full screen"
          type="button"
        >
          <StudioIcon name="fullscreen" />
        </button>
      </footer>
    </section>
  );
}
