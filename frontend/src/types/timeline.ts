// Media source reference
export interface MediaAsset {
  id: string;
  url: string;
  type: 'video' | 'audio' | 'image';
  duration: number; // Original media duration in seconds
  width?: number;
  height?: number;
  thumbnailUrl?: string;
}

// Timeline editor types
export interface Clip {
  id: string;
  trackId: string;

  // Timeline positioning
  startTime: number;  // Position on timeline in seconds
  duration: number;   // Duration on timeline in seconds

  // Source trimming
  trimStart: number;  // How much trimmed from start (sourceIn)
  trimEnd: number;    // How much trimmed from end

  // Media reference
  assetId?: string;   // Reference to MediaAsset
  assetUrl?: string;  // Direct URL for simple cases

  // Visual properties (for Remotion rendering)
  scale?: number;     // Default: 1.0
  position?: { x: number; y: number }; // Default: {x: 0.5, y: 0.5}
  rotation?: number;  // Default: 0
  opacity?: number;   // Default: 1

  // Audio
  volume?: number;    // Default: 1
  muted?: boolean;

  // UI
  name: string;
  color: string;
  selected: boolean;

  // AI context (optional)
  metadata?: {
    transcript?: string;
    scene?: string;
    tags?: string[];
  };

  // Remotion effects (optional)
  effects?: Effect[];
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

// Remotion-specific types
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

export interface TextStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  color: string;
}

// Remotion clip types (converted from timeline Clip)
export interface RemotionVideoClip {
  id: string;
  assetUrl: string;
  startInFrames: number;
  durationInFrames: number;
  sourceIn?: number; // Start frame within the source video (for trimming)
  sourceOut?: number; // End frame within the source video (for trimming)
  effects?: Effect[];
  scale?: number;
  position?: { x: number; y: number };
  rotation?: number;
  opacity?: number;
}

export interface RemotionTextClip {
  id: string;
  text: string;
  style: TextStyle;
  startInFrames: number;
  durationInFrames: number;
  effects?: Effect[];
}

export type RemotionClip = RemotionVideoClip | RemotionTextClip;

export interface RemotionTrack {
  id: string;
  type: 'video' | 'text';
  clips: RemotionClip[];
}

export interface VideoTimeline {
  project: ProjectSettings;
  timeline: RemotionTrack[];
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