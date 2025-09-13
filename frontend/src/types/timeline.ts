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
  position?: Position;
  layout?: Layout;
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