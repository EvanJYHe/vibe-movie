import React, { useCallback, useEffect, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  rectIntersection
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';

interface DragData {
  clip?: any;
  asset?: any;
}

interface TrackData {
  track?: any;
}
import { Track } from './Track';
import { TimeRuler } from './TimeRuler';
import { PlayHead } from './PlayHead';
import { MediaLibrary } from './MediaLibrary';
import { MediaUpload } from './MediaUpload';
import { ExportButton } from './ExportButton';
import { TextEditor } from './TextEditor';
import { useTimelineStore } from '../../stores/timelineStore';
import './Timeline.css';

export const Timeline: React.FC = () => {
  const {
    tracks,
    addTrack,
    addAsset,
    addClipFromAsset,
    moveClip,
    deselectAllClips,
    setZoom,
    zoom,
    pixelsPerSecond,
    snapToGrid,
    toggleSnapToGrid,
    gridSize,
    selectedClipIds,
    removeClip,
    splitClip,
    playheadPosition,
    duration
  } = useTimelineStore();

  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [showTextEditor, setShowTextEditor] = useState(false);
  const [dragActive, setDragActive] = useState<DragData | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5
      }
    }),
    useSensor(TouchSensor)
  );

  const handleDragStart = useCallback((event: { active: { data: { current: DragData } } }) => {
    console.log('Drag start:', event.active.data.current);
    setDragActive(event.active.data.current);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setDragActive(null);
    const { active, over } = event;

    if (!over) {
      return;
    }

    const activeData = active.data.current as DragData;
    const trackData = over.data.current as TrackData;

    // Handle dragging clips within timeline
    if (activeData?.clip && trackData?.track) {
      const deltaX = event.delta.x;
      const newStartTime = activeData.clip.startTime + (deltaX / pixelsPerSecond);

      let finalStartTime = Math.max(0, newStartTime);
      if (snapToGrid) {
        finalStartTime = Math.round(finalStartTime / gridSize) * gridSize;
      }

      moveClip(activeData.clip.id, trackData.track.id, finalStartTime);
    }

    // Handle dragging assets from media library to timeline
    else if (activeData?.asset && trackData?.track) {
      // Simple calculation: just drop at the beginning for now to test
      let startTime = 0;

      if (snapToGrid) {
        startTime = Math.round(startTime / gridSize) * gridSize;
      }

      addClipFromAsset(trackData.track.id, startTime, activeData.asset);
    }
  }, [moveClip, addClipFromAsset, pixelsPerSecond, snapToGrid, gridSize]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedClipIds.length > 0) {
      selectedClipIds.forEach(clipId => removeClip(clipId));
    } else if (e.key === ' ' && e.target === document.body) {
      e.preventDefault();
    } else if (e.key === 's' && !e.ctrlKey && !e.metaKey) {
      selectedClipIds.forEach(clipId => splitClip(clipId, playheadPosition));
    } else if (e.key === 'g') {
      toggleSnapToGrid();
    } else if (e.key === '=' || e.key === '+') {
      setZoom(zoom * 1.2);
    } else if (e.key === '-' || e.key === '_') {
      setZoom(zoom / 1.2);
    }
  }, [selectedClipIds, removeClip, splitClip, playheadPosition, toggleSnapToGrid, setZoom, zoom]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setZoom(zoom * delta);
    }
  }, [zoom, setZoom]);

  return (
    <div className="timeline-wrapper">
      <div className="timeline-help">
        <span>Drag media from library to timeline | Double-click: Split | Delete: Remove | G: Toggle snap | +/-: Zoom | S: Split at playhead</span>
      </div>
      <div className="timeline-toolbar">
        <button onClick={() => addTrack()} className="toolbar-btn">
          + Add Track
        </button>
        <button onClick={() => setShowMediaLibrary(!showMediaLibrary)} className={`toolbar-btn ${showMediaLibrary ? 'active' : ''}`}>
          📁 Media Library
        </button>
        <button onClick={() => setShowUpload(true)} className="toolbar-btn">
          📤 Upload Media
        </button>
        <button onClick={() => setShowTextEditor(true)} className="toolbar-btn">
          Add Text
        </button>
        <button onClick={toggleSnapToGrid} className={`toolbar-btn ${snapToGrid ? 'active' : ''}`}>
          Snap: {snapToGrid ? 'ON' : 'OFF'}
        </button>
        <ExportButton />
        <div className="zoom-controls">
          <button onClick={() => setZoom(zoom / 1.2)} className="toolbar-btn">
            -
          </button>
          <span className="zoom-label">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(zoom * 1.2)} className="toolbar-btn">
            +
          </button>
        </div>
        <div className="timeline-info">
          <span>Time: {playheadPosition.toFixed(2)}s</span>
          <span>Selected: {selectedClipIds.length}</span>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={rectIntersection}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div
          className="timeline-container"
          onWheel={handleWheel}
          onClick={() => deselectAllClips()}
        >
          <TimeRuler />
          <div className="tracks-container" style={{ width: `${duration * pixelsPerSecond}px` }}>
            {tracks.map((track, index) => (
              <Track key={track.id} track={track} index={index} />
            ))}
          </div>
          <PlayHead />
        </div>

        <MediaLibrary
          isOpen={showMediaLibrary}
          onClose={() => setShowMediaLibrary(false)}
        />

        <DragOverlay>
          {dragActive && (
            <div className="drag-preview">
              {dragActive.asset ? (
                <>
                  <span>Adding {dragActive.asset.type}...</span>
                  <small>{dragActive.asset.url.split('/').pop()?.split('.')[0]}</small>
                </>
              ) : (
                <span>Moving clip...</span>
              )}
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {showUpload && (
        <MediaUpload
          onUpload={addAsset}
          onClose={() => setShowUpload(false)}
        />
      )}

      {showTextEditor && (
        <TextEditor
          isOpen={showTextEditor}
          onClose={() => setShowTextEditor(false)}
        />
      )}
    </div>
  );
};