import React, { useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTimelineStore } from '../../stores/timelineStore';

export const PlayHead: React.FC = () => {
  const { playheadPosition, setPlayheadPosition, pixelsPerSecond, duration } = useTimelineStore();
  const isDragging = useRef(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    e.preventDefault();

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;

      const timelineElement = document.querySelector('.timeline-container');
      if (!timelineElement) return;

      const rect = timelineElement.getBoundingClientRect();
      const scrollLeft = timelineElement.scrollLeft;
      const x = Math.max(0, e.clientX - rect.left - 217 + scrollLeft); // Subtract track header width (200px + 16px padding + 1px border) and add scroll offset
      const newTime = Math.min(duration, Math.max(0, x / pixelsPerSecond));
      setPlayheadPosition(newTime);
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [pixelsPerSecond, duration, setPlayheadPosition]);

  return (
    <motion.div
      className="playhead"
      style={{
        left: `${217 + playheadPosition * pixelsPerSecond}px`
      }}
      onMouseDown={handleMouseDown}
      whileHover={{ scale: 1.1 }}
    >
      <div className="playhead-handle">
        <div className="playhead-triangle" />
      </div>
      <div className="playhead-line" />
    </motion.div>
  );
};