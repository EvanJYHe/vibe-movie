import React, { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useDraggable } from "@dnd-kit/core";
import type { Clip as ClipType } from "../../types/timeline";
import { useTimelineStore } from "../../stores/timelineStore";

interface ClipProps {
  clip: ClipType;
  trackId: string;
}

export const Clip: React.FC<ClipProps> = ({ clip, trackId }) => {
  const {
    selectClip,
    trimClip,
    splitClip,
    removeClip,
    getAsset,
    pixelsPerSecond,
    playheadPosition,
    snapToGrid,
    gridSize,
  } = useTimelineStore();

  const asset = clip.assetId ? getAsset(clip.assetId) : null;

  const [isTrimming, setIsTrimming] = useState<"start" | "end" | null>(null);

  const { attributes, listeners, setNodeRef, transform, isDragging } =
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
      e.stopPropagation();
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const clickTime = clip.startTime + x / pixelsPerSecond;
      splitClip(clip.id, clickTime);
    },
    [clip, pixelsPerSecond, splitClip]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Delete" && clip.selected) {
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
    <motion.div
      ref={setNodeRef}
      className={`clip ${clip.selected ? "selected" : ""} ${
        isTrimming ? "trimming" : ""
      }`}
      style={{
        ...style,
        backgroundColor: clip.color,
      }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      {...(isTrimming ? {} : { ...attributes, ...listeners })}
    >
      <div
        className="trim-handle trim-handle-start"
        onMouseDown={(e) => handleTrimStart(e, "start")}
      />
      <div className="clip-content">
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
            {asset.type === "video"
              ? "🎬"
              : asset.type === "audio"
              ? "🎵"
              : "🖼️"}
          </div>
        )}
      </div>
      <div
        className="trim-handle trim-handle-end"
        onMouseDown={(e) => handleTrimStart(e, "end")}
      />
      {Math.abs(playheadPosition - clip.startTime) < 0.1 && (
        <div className="split-indicator" />
      )}
    </motion.div>
  );
};
