import React, { useCallback, useRef } from "react";
import { useShallow } from "zustand/react/shallow";
import { useTimelineStore } from "../../stores/timelineStore";

export const PlayHead: React.FC = () => {
  const {
    playheadPosition,
    setPlayheadPosition,
    pixelsPerSecond,
    duration,
    snapToGrid,
    gridSize,
  } = useTimelineStore(
    useShallow((state) => ({
      playheadPosition: state.playheadPosition,
      setPlayheadPosition: state.setPlayheadPosition,
      pixelsPerSecond: state.pixelsPerSecond,
      duration: state.duration,
      snapToGrid: state.snapToGrid,
      gridSize: state.gridSize,
    }))
  );
  const activePointer = useRef<number | null>(null);

  const updatePosition = useCallback(
    (clientX: number) => {
      const timelineElement =
        document.querySelector<HTMLElement>(".timeline-scroll");
      if (!timelineElement) return;

      const rect = timelineElement.getBoundingClientRect();
      const scrollLeft = timelineElement.scrollLeft;
      const trackHeadWidth =
        timelineElement.querySelector<HTMLElement>(".track-header")
          ?.getBoundingClientRect().width ??
        timelineElement
          .querySelector<HTMLElement>(".ruler-header")
          ?.getBoundingClientRect().width ??
        128;
      const contentX = Math.min(
        duration * pixelsPerSecond,
        Math.max(0, clientX - rect.left - trackHeadWidth + scrollLeft)
      );
      const rawTime = contentX / pixelsPerSecond;
      const nextTime =
        snapToGrid && gridSize > 0
          ? Math.round(rawTime / gridSize) * gridSize
          : rawTime;

      setPlayheadPosition(Math.min(duration, Math.max(0, nextTime)));
    },
    [
      duration,
      gridSize,
      pixelsPerSecond,
      setPlayheadPosition,
      snapToGrid,
    ]
  );

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) return;
      event.preventDefault();
      event.stopPropagation();
      activePointer.current = event.pointerId;
      event.currentTarget.dataset.dragging = "true";
      event.currentTarget.setPointerCapture(event.pointerId);
      updatePosition(event.clientX);
    },
    [updatePosition]
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (activePointer.current !== event.pointerId) return;
      updatePosition(event.clientX);
    },
    [updatePosition]
  );

  const finishDrag = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (activePointer.current !== event.pointerId) return;
      activePointer.current = null;
      event.currentTarget.dataset.dragging = "false";
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    },
    []
  );

  return (
    <div
      className="playhead"
      style={{
        left: `calc(var(--timeline-track-head) + ${
          playheadPosition * pixelsPerSecond
        }px)`,
      }}
      data-dragging="false"
      onPointerCancel={finishDrag}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishDrag}
    >
      <div className="playhead-handle">
        <div className="playhead-triangle" />
      </div>
      <div className="playhead-line" />
    </div>
  );
};
