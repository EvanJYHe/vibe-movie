import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useShallow } from "zustand/react/shallow";
import { Track } from "./Track";
import { TimeRuler } from "./TimeRuler";
import { PlayHead } from "./PlayHead";
import { ClipActionMenu } from "./ClipActionMenu";
import { StudioIcon } from "../StudioIcon";
import { useTimelineStore } from "../../stores/timelineStore";
import "./Timeline.css";

function formatTimecode(seconds: number) {
  const safeSeconds = Math.max(0, seconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const wholeSeconds = Math.floor(safeSeconds % 60);
  const frames = Math.floor((safeSeconds % 1) * 30);
  return [hours, minutes, wholeSeconds, frames]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

function TimelineTimecode() {
  const playheadPosition = useTimelineStore((state) => state.playheadPosition);

  return (
    <output className="timeline-toolbar__time">
      {formatTimecode(playheadPosition)}
    </output>
  );
}

export function Timeline() {
  const {
    tracks,
    addTrack,
    deselectAllClips,
    setZoom,
    zoom,
    pixelsPerSecond,
    snapToGrid,
    gridSize,
    toggleSnapToGrid,
    selectedClipIds,
    removeClip,
    splitClip,
    duplicateClip,
    updateClip,
    setPlayheadPosition,
    duration,
  } = useTimelineStore(
    useShallow((state) => ({
      tracks: state.tracks,
      addTrack: state.addTrack,
      deselectAllClips: state.deselectAllClips,
      setZoom: state.setZoom,
      zoom: state.zoom,
      pixelsPerSecond: state.pixelsPerSecond,
      snapToGrid: state.snapToGrid,
      gridSize: state.gridSize,
      toggleSnapToGrid: state.toggleSnapToGrid,
      selectedClipIds: state.selectedClipIds,
      removeClip: state.removeClip,
      splitClip: state.splitClip,
      duplicateClip: state.duplicateClip,
      updateClip: state.updateClip,
      setPlayheadPosition: state.setPlayheadPosition,
      duration: state.duration,
    }))
  );
  const timelineScrollRef = useRef<HTMLDivElement>(null);
  const skimmerRef = useRef<HTMLDivElement>(null);
  const lastPointerClientX = useRef<number | null>(null);
  const activeScrubPointer = useRef<number | null>(null);
  const pendingClipClick = useRef<{
    pointerId: number;
    clientX: number;
    clientY: number;
  } | null>(null);
  const [clipMenu, setClipMenu] = useState<{
    clipId: string;
    anchor: { x: number; y: number };
    splitTime: number;
  } | null>(null);

  const openClipActions = useCallback(
    (
      clipId: string,
      anchor: { x: number; y: number },
      splitTime: number
    ) => {
      setClipMenu({ clipId, anchor, splitTime });
    },
    []
  );

  const getTimelinePosition = useCallback(
    (clientX: number, clampToViewport = false) => {
      const timelineElement = timelineScrollRef.current;
      if (!timelineElement) return null;

      const rect = timelineElement.getBoundingClientRect();
      const trackHeadWidth =
        timelineElement.querySelector<HTMLElement>(".track-header")
          ?.getBoundingClientRect().width ??
        timelineElement
          .querySelector<HTMLElement>(".ruler-header")
          ?.getBoundingClientRect().width ??
        128;
      const rawViewportX = clientX - rect.left;

      if (
        !clampToViewport &&
        (rawViewportX < trackHeadWidth || rawViewportX > rect.width)
      ) {
        return null;
      }

      const viewportX =
        Math.min(rect.width, Math.max(trackHeadWidth, rawViewportX)) -
        trackHeadWidth;
      const contentX = Math.min(
        duration * pixelsPerSecond,
        Math.max(0, viewportX + timelineElement.scrollLeft)
      );

      return {
        contentX,
        time: contentX / pixelsPerSecond,
      };
    },
    [duration, pixelsPerSecond]
  );

  const showSkimmerAt = useCallback(
    (clientX: number) => {
      const skimmer = skimmerRef.current;
      if (!skimmer) return;

      const position = getTimelinePosition(clientX);
      if (!position) {
        skimmer.dataset.visible = "false";
        return;
      }

      skimmer.style.transform = `translate3d(${position.contentX}px, 0, 0)`;
      skimmer.dataset.visible = "true";
    },
    [getTimelinePosition]
  );

  const commitPlayheadAt = useCallback(
    (clientX: number) => {
      const position = getTimelinePosition(clientX, true);
      if (!position) return;

      const nextTime =
        snapToGrid && gridSize > 0
          ? Math.round(position.time / gridSize) * gridSize
          : position.time;
      setPlayheadPosition(Math.min(duration, Math.max(0, nextTime)));
    },
    [
      duration,
      getTimelinePosition,
      gridSize,
      setPlayheadPosition,
      snapToGrid,
    ]
  );

  const isTimelineCanvasTarget = useCallback((target: EventTarget | null) => {
    if (!(target instanceof Element)) return false;
    if (
      target.closest(
        "button, input, textarea, select, .track-header, .ruler-header, .trim-handle, .playhead"
      )
    ) {
      return false;
    }
    return Boolean(target.closest(".ruler-track, .track, .clip"));
  }, []);

  const handleTimelinePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.pointerType !== "touch") {
        lastPointerClientX.current = event.clientX;
        showSkimmerAt(event.clientX);
      }

      if (activeScrubPointer.current === event.pointerId) {
        commitPlayheadAt(event.clientX);
      }
    },
    [commitPlayheadAt, showSkimmerAt]
  );

  const handleTimelinePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.button !== 0 || !isTimelineCanvasTarget(event.target)) return;

      const target = event.target as Element;
      if (target.closest(".clip")) {
        pendingClipClick.current = {
          pointerId: event.pointerId,
          clientX: event.clientX,
          clientY: event.clientY,
        };
        return;
      }

      activeScrubPointer.current = event.pointerId;
      event.currentTarget.setPointerCapture(event.pointerId);
      commitPlayheadAt(event.clientX);
    },
    [commitPlayheadAt, isTimelineCanvasTarget]
  );

  const handleTimelinePointerUp = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (activeScrubPointer.current === event.pointerId) {
        activeScrubPointer.current = null;
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
      }

      const pendingClick = pendingClipClick.current;
      if (pendingClick?.pointerId === event.pointerId) {
        const travel = Math.hypot(
          event.clientX - pendingClick.clientX,
          event.clientY - pendingClick.clientY
        );
        if (travel <= 4) {
          commitPlayheadAt(event.clientX);
        }
        pendingClipClick.current = null;
      }
    },
    [commitPlayheadAt]
  );

  const handleTimelinePointerCancel = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (activeScrubPointer.current === event.pointerId) {
        activeScrubPointer.current = null;
      }
      if (pendingClipClick.current?.pointerId === event.pointerId) {
        pendingClipClick.current = null;
      }
    },
    []
  );

  const handleTimelinePointerLeave = useCallback(() => {
    lastPointerClientX.current = null;
    if (skimmerRef.current) {
      skimmerRef.current.dataset.visible = "false";
    }
  }, []);

  const handleTimelineScroll = useCallback(() => {
    if (lastPointerClientX.current !== null) {
      showSkimmerAt(lastPointerClientX.current);
    }
  }, [showSkimmerAt]);

  const splitSelected = useCallback(() => {
    const playheadPosition = useTimelineStore.getState().playheadPosition;
    selectedClipIds.forEach((clipId) => splitClip(clipId, playheadPosition));
  }, [selectedClipIds, splitClip]);

  const duplicateSelected = useCallback(() => {
    selectedClipIds.forEach((clipId) => duplicateClip(clipId));
  }, [duplicateClip, selectedClipIds]);

  const toggleSelectedMute = useCallback(() => {
    const selectedClips = tracks
      .flatMap((track) => track.clips)
      .filter((clip) => selectedClipIds.includes(clip.id))
      .filter((clip) => clip.type === "video" || clip.type === "audio");

    selectedClips.forEach((clip) => {
      updateClip(clip.id, { muted: !clip.muted });
    });
  }, [selectedClipIds, tracks, updateClip]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT" ||
        target?.isContentEditable;
      if (isTyping) return;

      if (
        (event.key === "Delete" || event.key === "Backspace") &&
        selectedClipIds.length > 0
      ) {
        event.preventDefault();
        selectedClipIds.forEach((clipId) => removeClip(clipId));
      } else if (
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === "b"
      ) {
        event.preventDefault();
        splitSelected();
      } else if (
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === "d" &&
        selectedClipIds.length > 0
      ) {
        event.preventDefault();
        duplicateSelected();
      } else if (
        event.key.toLowerCase() === "m" &&
        selectedClipIds.length > 0
      ) {
        event.preventDefault();
        toggleSelectedMute();
      } else if (
        event.key.toLowerCase() === "s" &&
        !event.metaKey &&
        !event.ctrlKey
      ) {
        event.preventDefault();
        splitSelected();
      } else if (event.key.toLowerCase() === "g") {
        event.preventDefault();
        toggleSnapToGrid();
      } else if (event.key === "=" || event.key === "+") {
        event.preventDefault();
        setZoom(zoom * 1.2);
      } else if (event.key === "-" || event.key === "_") {
        event.preventDefault();
        setZoom(zoom / 1.2);
      }
    },
    [
      removeClip,
      selectedClipIds,
      setZoom,
      splitSelected,
      duplicateSelected,
      toggleSelectedMute,
      toggleSnapToGrid,
      zoom,
    ]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const handleWheel = useCallback(
    (event: React.WheelEvent) => {
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
        setZoom(zoom * (event.deltaY > 0 ? 0.9 : 1.1));
      }
    },
    [setZoom, zoom]
  );

  return (
    <section className="timeline-wrapper" aria-label="Timeline">
      <header className="timeline-toolbar">
        <div className="timeline-toolbar__group">
          <button
            aria-label="Selection tool"
            aria-pressed="true"
            className="timeline-tool is-active"
            title="Selection tool"
            type="button"
          >
            <StudioIcon name="pointer" size={14} />
          </button>
          <button
            aria-label="Split selected clips at playhead"
            className="timeline-tool"
            disabled={selectedClipIds.length === 0}
            onClick={splitSelected}
            title="Split selected at playhead (S)"
            type="button"
          >
            <StudioIcon name="blade" size={14} />
          </button>
          <span className="timeline-toolbar__divider" aria-hidden="true" />
          <button
            aria-label="Toggle timeline snapping"
            aria-pressed={snapToGrid}
            className={`timeline-tool ${snapToGrid ? "is-active" : ""}`}
            onClick={toggleSnapToGrid}
            title="Toggle snapping (G)"
            type="button"
          >
            <StudioIcon name="magnet" size={14} />
          </button>
        </div>

        <TimelineTimecode />

        <div className="timeline-toolbar__group timeline-toolbar__group--right">
          <button
            aria-label="Add track"
            className="timeline-tool"
            onClick={() => addTrack()}
            title="Add track"
            type="button"
          >
            <StudioIcon name="plus" size={14} />
          </button>
          <label className="timeline-zoom">
            <span className="sr-only">Timeline zoom</span>
            <input
              aria-label="Timeline zoom"
              max="6"
              min="0.2"
              onChange={(event) => setZoom(Number(event.target.value))}
              step="0.1"
              type="range"
              value={Math.max(0.2, Math.min(6, zoom))}
            />
          </label>
        </div>
      </header>

      <div
        ref={timelineScrollRef}
        className="timeline-scroll"
        onClick={deselectAllClips}
        onPointerCancel={handleTimelinePointerCancel}
        onPointerDownCapture={handleTimelinePointerDown}
        onPointerLeave={handleTimelinePointerLeave}
        onPointerMove={handleTimelinePointerMove}
        onPointerUpCapture={handleTimelinePointerUp}
        onScroll={handleTimelineScroll}
        onWheel={handleWheel}
        style={
          {
            "--timeline-grid-step": `${Math.min(
              240,
              Math.max(96, pixelsPerSecond * 4)
            )}px`,
          } as CSSProperties
        }
      >
        <TimeRuler />
        <div
          className="tracks-container"
          style={{
            width: `calc(var(--timeline-track-head) + ${
              duration * pixelsPerSecond
            }px)`,
          }}
        >
          {tracks.map((track, index) => (
            <Track
              index={index}
              key={track.id}
              onOpenClipActions={openClipActions}
              track={track}
            />
          ))}
        </div>
        <div
          ref={skimmerRef}
          aria-hidden="true"
          className="timeline-skimmer"
          data-visible="false"
        >
          <span className="timeline-skimmer__caret" />
          <span className="timeline-skimmer__line" />
        </div>
        <PlayHead />
      </div>

      {clipMenu ? (
        <ClipActionMenu
          anchor={clipMenu.anchor}
          clipId={clipMenu.clipId}
          onClose={() => setClipMenu(null)}
          splitTime={clipMenu.splitTime}
        />
      ) : null}
    </section>
  );
}
