import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Clip, Track, TimelineState, MediaAsset } from '../types/timeline';
import { cleanupUnusedFiles, deleteMediaFile, loadMediaFile } from '../utils/storage';
import { adaptAITimeline } from '../features/ai/timelineAdapter';
import { createId } from '../utils/id';

interface TimelineStore extends TimelineState {
  assets: MediaAsset[];
  addTrack: (name?: string) => void;
  removeTrack: (trackId: string) => void;
  addAsset: (asset: MediaAsset) => void;
  removeAsset: (assetId: string) => void;
  getAsset: (assetId: string) => MediaAsset | undefined;
  addClip: (trackId: string, startTime: number, assetId?: string) => void;
  addClipFromAsset: (trackId: string, startTime: number, asset: MediaAsset) => void;
  addTextClip: (trackId: string, startTime: number, text: string, duration: number) => void;
  removeClip: (clipId: string) => void;
  duplicateClip: (clipId: string) => void;
  moveClip: (clipId: string, newTrackId: string, newStartTime: number) => void;
  trimClip: (clipId: string, side: 'start' | 'end', newTime: number) => void;
  splitClip: (clipId: string, splitTime: number) => void;
  selectClip: (clipId: string, multiSelect?: boolean) => void;
  deselectAllClips: () => void;
  setPlayheadPosition: (position: number) => void;
  setZoom: (zoom: number) => void;
  toggleSnapToGrid: () => void;
  updateTrack: (trackId: string, updates: Partial<Track>) => void;
  updateClip: (clipId: string, updates: Partial<Clip>) => void;
  updateTimelineDuration: () => void;
  loadTimelineFromAI: (aiTimeline: unknown) => void;
  restoreMediaUrls: () => Promise<void>;
  cleanupStorage: () => Promise<void>;
}

type PersistedTimelineState = Pick<
  TimelineStore,
  | 'tracks'
  | 'assets'
  | 'duration'
  | 'zoom'
  | 'snapToGrid'
  | 'gridSize'
  | 'pixelsPerSecond'
  | 'playheadPosition'
  | 'selectedClipIds'
>;

export const useTimelineStore = create<TimelineStore>()(
  persist<TimelineStore, [], [], PersistedTimelineState>(
    (set, get) => ({
  tracks: [
    {
      id: 'track-1',
      name: 'Track 1',
      height: 80,
      muted: false,
      locked: false,
      color: '#4ECDC4',
      clips: []
    },
    {
      id: 'track-2',
      name: 'Track 2',
      height: 80,
      muted: false,
      locked: false,
      color: '#FF6B6B',
      clips: []
    }
  ],
  assets: [],
  playheadPosition: 0,
  zoom: 1,
  selectedClipIds: [],
  duration: 120, // Start with 2 minutes, will auto-extend
  pixelsPerSecond: 50,
  snapToGrid: true,
  gridSize: 0.1,

  addTrack: (name) => set((state) => ({
    tracks: [...state.tracks, {
      id: createId("track"),
      name: name || `Track ${state.tracks.length + 1}`,
      height: 80,
      muted: false,
      locked: false,
      color: '#666666', // Gray for tracks
      clips: []
    }]
  })),

  removeTrack: (trackId) => set((state) => ({
    tracks: state.tracks.filter(track => track.id !== trackId),
    selectedClipIds: state.selectedClipIds.filter(id => {
      const track = state.tracks.find(t => t.id === trackId);
      return !track?.clips.some(clip => clip.id === id);
    })
  })),

  addAsset: (asset) => set((state) => ({
    assets: [...state.assets, asset]
  })),

  removeAsset: (assetId) => {
    const asset = get().assets.find((candidate) => candidate.id === assetId);
    if (asset?.url.startsWith('blob:')) URL.revokeObjectURL(asset.url);
    if (asset?.fileId) void deleteMediaFile(asset.fileId);

    set((state) => ({
      assets: state.assets.filter(candidate => candidate.id !== assetId),
      tracks: state.tracks.map(track => ({
        ...track,
        clips: track.clips.filter(clip => clip.assetId !== assetId)
      }))
    }));
  },

  getAsset: (assetId) => {
    const state = get();
    return state.assets.find(asset => asset.id === assetId);
  },

  addClip: (trackId, startTime, assetId) => {
    set((state) => {
      const asset = assetId ? state.assets.find(a => a.id === assetId) : null;
      const fps = 30;

      const newClip: Clip = {
        id: createId("clip"),
        trackId,
        type: asset?.type || 'video',
        startTime,
        duration: asset ? asset.duration : 5,
        startInFrames: Math.floor(startTime * fps),
        durationInFrames: Math.floor((asset ? asset.duration : 5) * fps),
        trimStart: 0,
        trimEnd: 0,
        assetId: asset?.id,
        assetUrl: asset?.url,
        name: asset?.name || (asset ? asset.url.split('/').pop()?.split('.')[0] || 'Clip' : `Clip ${Date.now()}`),
        color: '#0080FF',
        selected: false
      };

      return {
        tracks: state.tracks.map(track =>
          track.id === trackId
            ? { ...track, clips: [...track.clips, newClip] }
            : track
        )
      };
    });

    // Auto-extend timeline after adding clip
    get().updateTimelineDuration();
  },

  addClipFromAsset: (trackId, startTime, asset) => {
    set((state) => {
      const fps = 30;

      const newClip: Clip = {
        id: createId("clip"),
        trackId,
        type: asset.type,
        startTime,
        duration: asset.duration,
        startInFrames: Math.floor(startTime * fps),
        durationInFrames: Math.floor(asset.duration * fps),
        trimStart: 0,
        trimEnd: 0,
        assetId: asset.id,
        assetUrl: asset.url,
        name: asset.name || asset.url.split('/').pop()?.split('.')[0] || 'Clip',
        color: '#0080FF',
        selected: false
      };

      return {
        tracks: state.tracks.map(track =>
          track.id === trackId
            ? { ...track, clips: [...track.clips, newClip] }
            : track
        )
      };
    });

    // Auto-extend timeline after adding clip
    get().updateTimelineDuration();
  },

  addTextClip: (trackId, startTime, text, duration) => {
    set((state) => {
      const fps = 30;

      const newClip: Clip = {
        id: createId("text"),
        trackId,
        type: 'text',
        startTime,
        duration,
        startInFrames: Math.floor(startTime * fps),
        durationInFrames: Math.floor(duration * fps),
        text,
        style: {
          fontFamily: 'Arial, sans-serif',
          fontSize: 48,
          fontWeight: 'bold',
          color: 'white',
          textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
        },
        position: { x: 50, y: 50, unit: '%' },
        name: `Text: ${text.substring(0, 20)}${text.length > 20 ? '...' : ''}`,
        color: '#00FF00', // Green for text clips
        selected: false,
        metadata: {
          transcript: text
        }
      };

      return {
        tracks: state.tracks.map(track =>
          track.id === trackId
            ? { ...track, clips: [...track.clips, newClip] }
            : track
        )
      };
    });

    // Auto-extend timeline after adding clip
    get().updateTimelineDuration();
  },

  removeClip: (clipId) => set((state) => ({
    tracks: state.tracks.map(track => ({
      ...track,
      clips: track.clips.filter(clip => clip.id !== clipId)
    })),
    selectedClipIds: state.selectedClipIds.filter(id => id !== clipId)
  })),

  duplicateClip: (clipId) => {
    set((state) => {
      const fps = 30;
      let duplicatedClipId: string | null = null;

      const tracks = state.tracks.map(track => {
        const clipIndex = track.clips.findIndex(clip => clip.id === clipId);
        if (clipIndex === -1) {
          return {
            ...track,
            clips: track.clips.map(clip => ({ ...clip, selected: false }))
          };
        }

        const sourceClip = track.clips[clipIndex];
        duplicatedClipId = createId("clip");
        const startTime = sourceClip.startTime + sourceClip.duration;
        const duplicate: Clip = {
          ...sourceClip,
          id: duplicatedClipId,
          startTime,
          startInFrames: Math.floor(startTime * fps),
          name: `${sourceClip.name} copy`,
          selected: true
        };
        const clips = track.clips.map(clip => ({ ...clip, selected: false }));
        clips.splice(clipIndex + 1, 0, duplicate);

        return { ...track, clips };
      });

      return {
        tracks,
        selectedClipIds: duplicatedClipId ? [duplicatedClipId] : state.selectedClipIds
      };
    });

    get().updateTimelineDuration();
  },

  moveClip: (clipId, newTrackId, newStartTime) => {
    set((state) => {
      const targetTrack = state.tracks.find((track) => track.id === newTrackId);
      if (!targetTrack || targetTrack.locked) return state;

      let clipToMove: Clip | undefined;
      const fps = 30;

      const tracksWithoutClip = state.tracks.map(track => {
        const clip = track.clips.find(c => c.id === clipId);
        if (clip) {
          clipToMove = {
            ...clip,
            trackId: newTrackId,
            startTime: newStartTime,
            startInFrames: Math.floor(newStartTime * fps)
          };
        }
        return {
          ...track,
          clips: track.clips.filter(c => c.id !== clipId)
        };
      });

      if (!clipToMove) return state;

      return {
        tracks: tracksWithoutClip.map(track =>
          track.id === newTrackId
            ? { ...track, clips: [...track.clips, clipToMove!] }
            : track
        )
      };
    });

    // Auto-extend timeline after moving clip
    get().updateTimelineDuration();
  },

  trimClip: (clipId, side, newTime) => {
    set((state) => {
      const fps = 30;

      return {
        tracks: state.tracks.map(track => ({
          ...track,
          clips: track.clips.map(clip => {
            if (clip.id !== clipId) return clip;

            if (side === 'start') {
              const delta = newTime - clip.startTime;
              const newDuration = clip.duration - delta;
              return {
                ...clip,
                startTime: newTime,
                duration: newDuration,
                startInFrames: Math.floor(newTime * fps),
                durationInFrames: Math.floor(newDuration * fps),
                trimStart: (clip.trimStart ?? 0) + delta
              };
            } else {
              const newDuration = newTime - clip.startTime;
              return {
                ...clip,
                duration: newDuration,
                durationInFrames: Math.floor(newDuration * fps),
                trimEnd: (clip.trimEnd ?? 0) + (clip.duration - newDuration)
              };
            }
          })
        }))
      };
    });

    // Auto-extend timeline after trimming clip
    get().updateTimelineDuration();
  },

  splitClip: (clipId, splitTime) => set((state) => {
    const tracks = state.tracks.map(track => {
      const clipIndex = track.clips.findIndex(c => c.id === clipId);
      if (clipIndex === -1) return track;

      const clip = track.clips[clipIndex];
      if (splitTime <= clip.startTime || splitTime >= clip.startTime + clip.duration) {
        return track;
      }

      const splitPoint = splitTime - clip.startTime;

      const firstClip: Clip = {
        ...clip,
        duration: splitPoint,
        durationInFrames: Math.floor(splitPoint * 30)
      };

      const secondClip: Clip = {
        ...clip,
        id: createId("clip"),
        startTime: splitTime,
        duration: clip.duration - splitPoint,
        startInFrames: Math.floor(splitTime * 30),
        durationInFrames: Math.floor((clip.duration - splitPoint) * 30),
        trimStart: (clip.trimStart ?? 0) + splitPoint,
        selected: false
      };

      const newClips = [...track.clips];
      newClips.splice(clipIndex, 1, firstClip, secondClip);

      return { ...track, clips: newClips };
    });

    return { tracks };
  }),

  selectClip: (clipId, multiSelect = false) => set((state) => ({
    selectedClipIds: multiSelect
      ? state.selectedClipIds.includes(clipId)
        ? state.selectedClipIds.filter(id => id !== clipId)
        : [...state.selectedClipIds, clipId]
      : [clipId],
    tracks: state.tracks.map(track => ({
      ...track,
      clips: track.clips.map(clip => ({
        ...clip,
        selected: multiSelect
          ? clip.id === clipId ? !clip.selected : clip.selected
          : clip.id === clipId
      }))
    }))
  })),

  deselectAllClips: () => set((state) => ({
    selectedClipIds: [],
    tracks: state.tracks.map(track => ({
      ...track,
      clips: track.clips.map(clip => ({ ...clip, selected: false }))
    }))
  })),

  setPlayheadPosition: (position) => set({ playheadPosition: position }),

  setZoom: (zoom) => set({
    zoom: Math.max(0.1, Math.min(10, zoom)),
    pixelsPerSecond: 50 * Math.max(0.1, Math.min(10, zoom))
  }),

  toggleSnapToGrid: () => set((state) => ({ snapToGrid: !state.snapToGrid })),

  updateTrack: (trackId, updates) => set((state) => ({
    tracks: state.tracks.map(track =>
      track.id === trackId ? { ...track, ...updates } : track
    )
  })),

  updateClip: (clipId, updates) => set((state) => ({
    tracks: state.tracks.map(track => ({
      ...track,
      clips: track.clips.map(clip =>
        clip.id === clipId ? { ...clip, ...updates } : clip
      )
    }))
  })),

  updateTimelineDuration: () => set((state) => {
    // Find the furthest end point of any clip
    let maxEndTime = 0;

    state.tracks.forEach(track => {
      track.clips.forEach(clip => {
        const clipEnd = clip.startTime + clip.duration;
        maxEndTime = Math.max(maxEndTime, clipEnd);
      });
    });

    // Add padding and ensure minimum duration
    const minDuration = 120; // 2 minutes minimum
    const padding = 60; // 1 minute of extra space
    const newDuration = Math.max(minDuration, maxEndTime + padding);

    // Always update duration to ensure it reflects current content
    if (newDuration !== state.duration) {
      return { duration: newDuration };
    }

    return state;
  }),

  loadTimelineFromAI: (aiTimeline) => set((state) => {
    const tracks = adaptAITimeline(aiTimeline);
    if (!tracks) {
      console.warn('The AI response did not contain a valid timeline.');
      return state;
    }

    return { tracks, selectedClipIds: [], playheadPosition: 0 };
  }),

  restoreMediaUrls: async () => {
    const state = get();
    const assets = [...state.assets];
    let urlsRestored = 0;

    // Restore URLs for assets that have fileIds
    for (const asset of assets) {
      if (asset.fileId && !asset.url.startsWith('blob:')) {
        try {
          const restoredUrl = await loadMediaFile(asset.fileId);
          if (restoredUrl) {
            asset.url = restoredUrl;
            if (asset.thumbnailUrl && asset.thumbnailUrl !== restoredUrl) {
              // For images, use the same URL as thumbnail
              if (asset.type === 'image') {
                asset.thumbnailUrl = restoredUrl;
              }
            }
            urlsRestored++;
          }
        } catch (error) {
          console.error(`Failed to restore URL for asset ${asset.id}:`, error);
        }
      }
    }

    if (urlsRestored > 0) {
      set({ assets });
    }
  },

  cleanupStorage: async () => {
    const state = get();
    const activeFileIds = state.assets
      .filter(asset => asset.fileId)
      .map(asset => asset.fileId!);

    try {
      await cleanupUnusedFiles(activeFileIds);
    } catch (error) {
      console.error('Failed to cleanup storage:', error);
    }
  }
    }),
    {
      name: 'timeline-storage',
      storage: createJSONStorage<PersistedTimelineState>(() => localStorage),
      partialize: (state) => ({
        tracks: state.tracks,
        assets: state.assets.map(asset => ({
          ...asset,
          // Don't persist blob URLs, only file IDs and metadata
          url: asset.fileId ? '' : asset.url,
          thumbnailUrl: asset.fileId && asset.type !== 'image' ? asset.thumbnailUrl : ''
        })),
        duration: state.duration,
        zoom: state.zoom,
        snapToGrid: state.snapToGrid,
        gridSize: state.gridSize,
        pixelsPerSecond: state.pixelsPerSecond,
        playheadPosition: 0, // Reset playhead on reload
        selectedClipIds: [] // Don't persist selection
      }),
    }
  )
);
