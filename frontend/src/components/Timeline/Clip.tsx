import React, { useCallback, useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { useShallow } from "zustand/react/shallow";
import type { Clip as ClipType } from "../../types/timeline";
import { useTimelineStore } from "../../stores/timelineStore";
import { StudioIcon } from "../StudioIcon";

interface ClipProps {
  clip: ClipType;
  trackId: string;
  onOpenActions: (
    clipId: string,
    anchor: { x: number; y: number },
    splitTime: number
  ) => void;
}

export const Clip: React.FC<ClipProps> = React.memo(function Clip({
  clip,
  trackId,
  onOpenActions,
}) {
  const {
    selectClip,
    trimClip,
    removeClip,
    pixelsPerSecond,
    snapToGrid,
    gridSize,
  } = useTimelineStore(
    useShallow((state) => ({
      selectClip: state.selectClip,
      trimClip: state.trimClip,
      removeClip: state.removeClip,
      pixelsPerSecond: state.pixelsPerSecond,
      snapToGrid: state.snapToGrid,
      gridSize: state.gridSize,
    }))
  );

  const asset = useTimelineStore((state) =>
    clip.assetId
      ? state.assets.find((candidate) => candidate.id === clip.assetId) ?? null
      : null
  );
  const isAtPlayhead = useTimelineStore(
    (state) => Math.abs(state.playheadPosition - clip.startTime) < 0.1
  );
  const isTextClip = clip.metadata?.transcript && !clip.assetUrl && !clip.assetId;

  const [isTrimming, setIsTrimming] = useState<"start" | "end" | null>(null);

  const { attributes, listeners, setNodeRef, isDragging } =
    useDraggable({
      id: clip.id,
      data: { clip, trackId },
    });

  const style = {
    left: `${clip.startTime * pixelsPerSecond}px`,
    width: `${clip.duration * pixelsPerSecond}px`,
    // transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      selectClip(clip.id, e.shiftKey || e.ctrlKey || e.metaKey);
    },
    [clip.id, selectClip]
  );

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const clickTime = clip.startTime + x / pixelsPerSecond;
      selectClip(clip.id);
      onOpenActions(
        clip.id,
        { x: e.clientX + 8, y: e.clientY + 8 },
        clickTime
      );
    },
    [clip, onOpenActions, pixelsPerSecond, selectClip]
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const clickTime = clip.startTime + x / pixelsPerSecond;
      selectClip(clip.id);
      onOpenActions(
        clip.id,
        { x: e.clientX + 8, y: e.clientY + 8 },
        clickTime
      );
    },
    [clip, onOpenActions, pixelsPerSecond, selectClip]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.key === "Delete" || e.key === "Backspace") && clip.selected) {
        removeClip(clip.id);
      }
    },
    [clip.id, clip.selected, removeClip]
  );

  const handleTrimStart = useCallback(
    (e: React.MouseEvent, side: "start" | "end") => {
      e.stopPropagation();
      setIsTrimming(side);
      const initialX = e.clientX;
      const initialStartTime = clip.startTime;
      const initialDuration = clip.duration;

      const handleMouseMove = (e: MouseEvent) => {
        const delta = (e.clientX - initialX) / pixelsPerSecond;

        if (side === "start") {
          let newStartTime = initialStartTime + delta;
          if (snapToGrid) {
            newStartTime = Math.round(newStartTime / gridSize) * gridSize;
          }
          // Ensure clip doesn't become too small
          if (
            newStartTime < initialStartTime + initialDuration - 0.1 &&
            newStartTime >= 0
          ) {
            trimClip(clip.id, side, newStartTime);
          }
        } else {
          let newEndTime = initialStartTime + initialDuration + delta;
          if (snapToGrid) {
            newEndTime = Math.round(newEndTime / gridSize) * gridSize;
          }
          // Ensure clip doesn't become too small
          if (newEndTime > initialStartTime + 0.1) {
            trimClip(clip.id, side, newEndTime);
          }
        }
      };

      const handleMouseUp = () => {
        setIsTrimming(null);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [clip, pixelsPerSecond, snapToGrid, gridSize, trimClip]
  );

  return (
    <div
      ref={setNodeRef}
      {...(isTrimming ? {} : attributes)}
      {...(isTrimming ? {} : listeners)}
      aria-label={`${clip.name}, ${clip.type} clip${
        clip.muted ? ", muted" : ""
      }`}
      aria-selected={clip.selected}
      className={`clip clip--${clip.type} ${
        clip.muted ? "clip--muted" : ""
      } ${clip.selected ? "selected" : ""} ${
        isTrimming ? "trimming" : ""
      }`}
      role="button"
      style={style}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      onDoubleClick={handleDoubleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div
        className="trim-handle trim-handle-start"
        onMouseDown={(e) => handleTrimStart(e, "start")}
      />
      <div className="clip-content">
        {isTextClip ? (
          // Text clip content
          <>
            <div className="text-clip-icon">T</div>
            <div className="clip-info">
              <span className="clip-name">{clip.name}</span>
              <div className="clip-metadata">
                <span className="clip-type">text</span>
                <span className="text-preview">{clip.metadata?.transcript}</span>
              </div>
            </div>
          </>
        ) : (
          // Media clip content
          <>
            {asset?.thumbnailUrl && (
              <div className="clip-thumbnail">
                <img src={asset.thumbnailUrl} alt={clip.name} />
              </div>
            )}
            <div className="clip-info">
              <span className="clip-name">{clip.name}</span>
              {asset && (
                <div className="clip-metadata">
                  <span className="clip-type">{asset.type}</span>
                  {asset.width && asset.height && (
                    <span className="clip-resolution">
                      {asset.width}×{asset.height}
                    </span>
                  )}
                </div>
              )}
            </div>
            {asset && (
              <div className="clip-media-icon">
                <StudioIcon
                  name={
                    clip.muted
                      ? "mute"
                      : asset.type === "video"
                      ? "video"
                      : asset.type === "audio"
                      ? "wave"
                      : "media"
                  }
                  size={14}
                />
              </div>
            )}
          </>
        )}
      </div>
      <div
        className="trim-handle trim-handle-end"
        onMouseDown={(e) => handleTrimStart(e, "end")}
      />
      {isAtPlayhead && <div className="split-indicator" />}
    </div>
  );
});
