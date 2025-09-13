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

export interface BaseClip {
  id: string;
  startInFrames: number;
  durationInFrames: number;
  effects?: Effect[];
}

export interface VideoClip extends BaseClip {
  assetUrl: string;
}

export interface TextClip extends BaseClip {
  text: string;
  style: TextStyle;
}

export type Clip = VideoClip | TextClip;

export interface Track {
  id: string;
  type: 'video' | 'text';
  clips: Clip[];
}

export interface VideoTimeline {
  project: ProjectSettings;
  timeline: Track[];
}