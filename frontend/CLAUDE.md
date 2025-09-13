# Vibe Movie Editor - Frontend

## Project Overview
A React-based AI-powered video editor with a timeline component for editing video clips. Built with Vite, TypeScript, and modern drag-and-drop functionality.

## Tech Stack
- **Framework**: React 19.1.1 with TypeScript
- **Build Tool**: Vite 7.1.2
- **State Management**: Zustand 5.0.8
- **Drag & Drop**: @dnd-kit/core 6.3.1
- **Animations**: Framer Motion 12.23.12
- **Styling**: CSS with dark theme

## Project Structure
```
src/
├── components/
│   └── Timeline/
│       ├── Timeline.tsx          # Main timeline container
│       ├── Timeline.css          # Timeline styles
│       ├── Track.tsx            # Individual track component
│       ├── Clip.tsx             # Video/audio clip component
│       ├── TimeRuler.tsx        # Time measurement ruler
│       ├── PlayHead.tsx         # Playback position indicator
│       ├── MediaLibrary.tsx     # Media file management
│       └── MediaUpload.tsx      # File upload component
├── stores/
│   └── timelineStore.ts         # Zustand state management
├── types/
│   └── timeline.ts              # TypeScript interfaces
├── App.tsx                      # Main app component
├── App.css                      # App-level styles
└── index.css                    # Global styles
```

## Core Features

### Timeline Component
- **Multi-track editing** with drag-and-drop clips
- **Auto-extending timeline** based on clip content
- **Snap-to-grid** functionality for precise positioning
- **Zoom controls** (+/- keys or Ctrl+scroll)
- **Playhead** for timeline position tracking

### Media Management
- **File upload** with drag-and-drop support
- **Media library** sidebar for managing assets
- **Thumbnail generation** for video files
- **Duration detection** for all media types
- **Supported formats**: MP4, WebM, MOV, MP3, WAV, JPG, PNG

### Clip Operations
- **Drag clips** between tracks and positions
- **Trim clips** by dragging edges
- **Split clips** (double-click or 'S' key at playhead)
- **Multi-select** with Shift/Ctrl
- **Delete** selected clips with Delete key

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint

# Type check
npx tsc --noEmit
```

## Key Keyboard Shortcuts
- **Alt+Click**: Add clip at cursor (legacy - now use media library)
- **Double-click**: Split clip at cursor
- **Delete**: Remove selected clips
- **S**: Split selected clips at playhead position
- **G**: Toggle snap to grid
- **+/-**: Zoom in/out timeline
- **Ctrl+Scroll**: Zoom with mouse wheel

## State Management (Zustand Store)

### Main State
- `tracks`: Array of track objects with clips
- `assets`: Array of uploaded media assets
- `playheadPosition`: Current timeline position
- `zoom`: Timeline zoom level
- `duration`: Total timeline duration (auto-extends)
- `pixelsPerSecond`: Rendering scale
- `selectedClipIds`: Currently selected clips

### Key Actions
- `addAsset(asset)`: Add media file to library
- `addClipFromAsset(trackId, startTime, asset)`: Create clip from media
- `moveClip(clipId, trackId, startTime)`: Move clip between tracks
- `trimClip(clipId, side, newTime)`: Adjust clip boundaries
- `splitClip(clipId, splitTime)`: Split clip at position
- `updateTimelineDuration()`: Auto-extend timeline

## Types & Interfaces

### MediaAsset
```typescript
interface MediaAsset {
  id: string;
  url: string;
  type: 'video' | 'audio' | 'image';
  duration: number;
  width?: number;
  height?: number;
  thumbnailUrl?: string;
}
```

### Clip
```typescript
interface Clip {
  id: string;
  trackId: string;
  startTime: number;
  duration: number;
  trimStart: number;
  trimEnd: number;
  assetId?: string;
  assetUrl?: string;
  name: string;
  color: string;
  selected: boolean;
  // Optional rendering properties
  scale?: number;
  position?: { x: number; y: number };
  rotation?: number;
  opacity?: number;
  volume?: number;
  muted?: boolean;
  metadata?: {
    transcript?: string;
    scene?: string;
    tags?: string[];
  };
}
```

## Styling
- **Dark theme** optimized for video editing
- **Responsive design** with flexible layouts
- **Visual feedback** for hover, selection, and drag states
- **Custom scrollbars** and modern UI elements

## Current Issues & TODOs
- [ ] Drag and drop from media library needs debugging
- [ ] Video preview component implementation
- [ ] Backend integration for persistent storage
- [ ] Export functionality for final video rendering
- [ ] Audio waveform visualization
- [ ] Keyboard shortcut improvements

## Development Notes
- Uses React 19 with modern hooks and patterns
- All state updates trigger auto-timeline extension
- Drag-and-drop uses rect intersection for better collision detection
- File uploads create object URLs for browser-based media handling
- Console logging active for debugging timeline duration issues

## Remotion Integration Ready
The clip schema includes properties needed for Remotion video rendering:
- Source trimming (sourceIn/Out via trimStart/trimEnd)
- Visual transforms (scale, position, rotation, opacity)
- Audio properties (volume, muted)
- Timeline positioning for frame calculations