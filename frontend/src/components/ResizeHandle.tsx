import React, { useCallback, useEffect, useState } from 'react';
import './ResizeHandle.css';

interface ResizeHandleProps {
  direction: 'vertical' | 'horizontal';
  onResize: (position: number) => void;
  onResizeEnd?: () => void;
  className?: string;
}

export const ResizeHandle: React.FC<ResizeHandleProps> = ({
  direction,
  onResize,
  onResizeEnd,
  className = ''
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setStartPos({ x: e.clientX, y: e.clientY });
    document.body.style.cursor = direction === 'vertical' ? 'row-resize' : 'col-resize';
  }, [direction]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;

    e.preventDefault();
    const position = direction === 'vertical' ? e.clientY : e.clientX;
    onResize(position);
  }, [isDragging, direction, onResize]);

  const handleMouseUp = useCallback(() => {
    if (!isDragging) return;

    setIsDragging(false);
    document.body.style.cursor = 'default';
    onResizeEnd?.();
  }, [isDragging, onResizeEnd]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('selectstart', preventDefault);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('selectstart', preventDefault);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const preventDefault = (e: Event) => e.preventDefault();

  const baseClass = `resize-handle resize-handle--${direction}`;
  const activeClass = isDragging ? 'resize-handle--active' : '';

  return (
    <div
      className={`${baseClass} ${activeClass} ${className}`}
      onMouseDown={handleMouseDown}
    >
      <div className="resize-handle__indicator" />
    </div>
  );
};