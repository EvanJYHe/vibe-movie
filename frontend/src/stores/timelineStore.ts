import { create } from 'zustand';
import type { Clip, Track, TimelineState, MediaAsset } from '../types/timeline';

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
  loadTimelineFromAI: (aiTimeline: any) => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const generateColor = () => {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA6CA', '#74B9FF', '#A29BFE'];
  return colors[Math.floor(Math.random() * colors.length)];
};

export const useTimelineStore = create<TimelineStore>((set) => ({
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
      id: generateId(),
      name: name || `Track ${state.tracks.length + 1}`,
      height: 80,
      muted: false,
      locked: false,
      color: generateColor(),
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

  removeAsset: (assetId) => set((state) => ({
    assets: state.assets.filter(asset => asset.id !== assetId),
    tracks: state.tracks.map(track => ({
      ...track,
      clips: track.clips.filter(clip => clip.assetId !== assetId)
    }))
  })),

  getAsset: (assetId) => {
    const state = useTimelineStore.getState();
    return state.assets.find(asset => asset.id === assetId);
  },

  addClip: (trackId, startTime, assetId) => {
    set((state) => {
      const asset = assetId ? state.assets.find(a => a.id === assetId) : null;

      const newClip: Clip = {
        id: generateId(),
        trackId,
        startTime,
        duration: asset ? asset.duration : 5,
        trimStart: 0,
        trimEnd: 0,
        assetId: asset?.id,
        assetUrl: asset?.url,
        name: asset ? asset.url.split('/').pop()?.split('.')[0] || 'Clip' : `Clip ${Date.now()}`,
        color: generateColor(),
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
    useTimelineStore.getState().updateTimelineDuration();
  },

  addClipFromAsset: (trackId, startTime, asset) => {
    set((state) => {
      const newClip: Clip = {
        id: generateId(),
        trackId,
        startTime,
        duration: asset.duration,
        trimStart: 0,
        trimEnd: 0,
        assetId: asset.id,
        assetUrl: asset.url,
        name: asset.url.split('/').pop()?.split('.')[0] || 'Clip',
        color: generateColor(),
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
    useTimelineStore.getState().updateTimelineDuration();
  },

  addTextClip: (trackId, startTime, text, duration) => {
    set((state) => {
      const newClip: Clip = {
        id: generateId(),
        trackId,
        startTime,
        duration,
        trimStart: 0,
        trimEnd: 0,
        // No assetId or assetUrl for text clips
        name: `Text: ${text.substring(0, 20)}${text.length > 20 ? '...' : ''}`,
        color: '#FF6B6B', // Special color for text clips
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
    useTimelineStore.getState().updateTimelineDuration();
  },

  removeClip: (clipId) => set((state) => ({
    tracks: state.tracks.map(track => ({
      ...track,
      clips: track.clips.filter(clip => clip.id !== clipId)
    })),
    selectedClipIds: state.selectedClipIds.filter(id => id !== clipId)
  })),

  moveClip: (clipId, newTrackId, newStartTime) => {
    set((state) => {
      let clipToMove: Clip | undefined;

      const tracksWithoutClip = state.tracks.map(track => {
        const clip = track.clips.find(c => c.id === clipId);
        if (clip) {
          clipToMove = { ...clip, trackId: newTrackId, startTime: newStartTime };
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
    useTimelineStore.getState().updateTimelineDuration();
  },

  trimClip: (clipId, side, newTime) => {
    set((state) => ({
      tracks: state.tracks.map(track => ({
        ...track,
        clips: track.clips.map(clip => {
          if (clip.id !== clipId) return clip;

          if (side === 'start') {
            const delta = newTime - clip.startTime;
            return {
              ...clip,
              startTime: newTime,
              duration: clip.duration - delta,
              trimStart: clip.trimStart + delta
            };
          } else {
            const newDuration = newTime - clip.startTime;
            return {
              ...clip,
              duration: newDuration,
              trimEnd: clip.trimEnd + (clip.duration - newDuration)
            };
          }
        })
      }))
    }));

    // Auto-extend timeline after trimming clip
    useTimelineStore.getState().updateTimelineDuration();
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
        duration: splitPoint
      };

      const secondClip: Clip = {
        ...clip,
        id: generateId(),
        startTime: splitTime,
        duration: clip.duration - splitPoint,
        trimStart: clip.trimStart + splitPoint
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
        console.log(`Clip: ${clip.name}, Start: ${clip.startTime}, Duration: ${clip.duration}, End: ${clipEnd}`);
      });
    });

    // Add padding and ensure minimum duration
    const minDuration = 120; // 2 minutes minimum
    const padding = 60; // 1 minute of extra space
    const newDuration = Math.max(minDuration, maxEndTime + padding);

    console.log(`Timeline Duration Update: maxEndTime=${maxEndTime}, current=${state.duration}, new=${newDuration}`);

    // Always update duration to ensure it reflects current content
    if (newDuration !== state.duration) {
      console.log(`Updating timeline duration from ${state.duration} to ${newDuration}`);
      return { duration: newDuration };
    }

    return state;
  }),

  loadTimelineFromAI: (aiTimeline) => set((state) => {
    try {
      // Convert AI timeline format to our timeline format
      if (!aiTimeline?.timeline || !Array.isArray(aiTimeline.timeline)) {
        console.warn('Invalid AI timeline format:', aiTimeline);
        return state;
      }

      const newTracks: Track[] = aiTimeline.timeline.map((aiTrack: any, index: number) => {
        const trackId = `ai-track-${index + 1}`;

        const clips: Clip[] = (aiTrack.clips || []).map((aiClip: any) => {
          // Convert frame-based to time-based (assuming 30 fps)
          const fps = aiTimeline.project?.fps || 30;
          const startTime = (aiClip.startInFrames || 0) / fps;
          const duration = (aiClip.durationInFrames || 0) / fps;

          return {
            id: aiClip.id || generateId(),
            trackId,
            startTime,
            duration,
            trimStart: 0,
            trimEnd: 0,
            assetId: undefined,
            assetUrl: aiClip.assetUrl,
            name: aiClip.text || aiClip.assetUrl?.split('/').pop()?.split('.')[0] || 'AI Clip',
            color: generateColor(),
            selected: false,
            // Copy AI properties
            scale: aiClip.scale,
            position: aiClip.position,
            rotation: aiClip.rotation,
            opacity: aiClip.opacity,
            volume: aiClip.volume,
            muted: aiClip.muted,
            metadata: {
              transcript: aiClip.text,
              scene: aiClip.scene,
              tags: aiClip.tags
            },
            effects: aiClip.effects
          };
        });

        return {
          id: trackId,
          name: `AI Track ${index + 1}`,
          height: 80,
          muted: false,
          locked: false,
          color: generateColor(),
          clips,
          type: aiTrack.type
        };
      });

      console.log('Loading AI timeline with tracks:', newTracks);

      // Replace current tracks with AI tracks
      return {
        tracks: newTracks,
        selectedClipIds: [],
        playheadPosition: 0
      };
    } catch (error) {
      console.error('Error loading AI timeline:', error);
      return state;
    }
  })
}));