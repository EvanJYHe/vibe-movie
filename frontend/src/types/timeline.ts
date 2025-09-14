// Media source reference
export interface MediaAsset {
  id: string;
  url: string;
  type: 'video' | 'audio' | 'image';
  duration: number; // Original media duration in seconds
  width?: number;
  height?: number;
  thumbnailUrl?: string;
  fileId?: string; // Reference to file stored in IndexedDB
}

// Unified clip type for all media and content
export interface Clip {
  id: string;
  trackId: string;
  type: 'video' | 'audio' | 'image' | 'text';

  // Timeline positioning
  startTime: number;  // Position on timeline in seconds
  duration: number;   // Duration on timeline in seconds
  startInFrames: number; // Position in frames (for Remotion)
  durationInFrames: number; // Duration in frames (for Remotion)

  // Media properties (for video/audio/image clips)
  assetId?: string;   // Reference to MediaAsset
  assetUrl?: string;  // Direct URL for media
  trimStart?: number; // Source trimming start (sourceIn)
  trimEnd?: number;   // Source trimming end
  volume?: number;    // Audio volume (0-1)
  muted?: boolean;    // Audio muted state

  // Text properties (for text clips)
  text?: string;      // Text content
  style?: TextStyle;  // Text styling

  // Visual properties (for all clip types)
  scale?: number;     // Default: 1.0
  position?: Position; // Position with units
  rotation?: number;  // Default: 0
  opacity?: number;   // Default: 1

  // UI properties
  name: string;
  color: string;
  selected: boolean;

  // AI context (optional)
  metadata?: {
    transcript?: string;
    scene?: string;
    tags?: string[];
  };

  // Effects (optional)
  effects?: Effect[];
  layout?: Layout;    // Text layout properties
}

export interface Track {
  id: string;
  name: string;
  height: number;
  muted: boolean;
  locked: boolean;
  color: string;
  clips: Clip[];
  type?: 'video' | 'audio' | 'image' | 'text'; // For Remotion compatibility
}

export interface TimelineState {
  tracks: Track[];
  playheadPosition: number;
  zoom: number;
  selectedClipIds: string[];
  duration: number;
  pixelsPerSecond: number;
  snapToGrid: boolean;
  gridSize: number;
}

export interface DragData {
  clipId: string;
  trackId: string;
  offsetX: number;
}

export interface TrimHandle {
  clipId: string;
  side: 'start' | 'end';
  initialPosition: number;
  initialDuration: number;
}

// Shared types
export interface ProjectSettings {
  width: number;
  height: number;
  fps: number;
}

export interface Effect {
  type: 'fade-in' | 'fade-out' | 'slide-in';
  durationInFrames: number;
  direction?: 'from-bottom' | 'from-top' | 'from-left' | 'from-right';
}

export type PositionUnit = 'px' | '%' | 'vw' | 'vh';

export interface Position {
  x: number;
  y: number;
  unit?: PositionUnit;
  anchor?: 'top-left' | 'top-center' | 'top-right' | 'center-left' | 'center' | 'center-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
}

export interface Layout {
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  maxWidth?: number;
  maxWidthUnit?: PositionUnit;
  wordWrap?: 'normal' | 'break-word' | 'nowrap';
  lineHeight?: number;
}

export interface TextStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  color: string;
  textShadow?: string;
  letterSpacing?: number;
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
}



export interface VideoTimeline {
  project: ProjectSettings;
  timeline: Track[];
}

// For Remotion export
export interface CompositionSettings {
  fps: number;
  width: number;
  height: number;
  durationInFrames: number;
}

// Complete project
export interface Project {
  id: string;
  name: string;
  tracks: Track[];
  assets: MediaAsset[];
  settings: CompositionSettings;
}