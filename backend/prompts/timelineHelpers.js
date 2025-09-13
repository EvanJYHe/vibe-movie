// Timeline manipulation utilities and validation helpers

/**
 * Generate unique ID for clips and tracks
 */
function generateClipId(type = 'clip') {
  return `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * Convert seconds to frames based on fps
 */
function secondsToFrames(seconds, fps = 30) {
  return Math.round(seconds * fps);
}

/**
 * Convert frames to seconds based on fps
 */
function framesToSeconds(frames, fps = 30) {
  return frames / fps;
}

/**
 * Default project settings
 */
const DEFAULT_PROJECT = {
  width: 1920,
  height: 1080,
  fps: 30
};

/**
 * Default text style
 */
const DEFAULT_TEXT_STYLE = {
  fontFamily: "Arial, sans-serif",
  fontSize: 64,
  fontWeight: "bold",
  color: "#FFFFFF"
};

/**
 * Common durations in frames (at 30fps)
 */
const COMMON_DURATIONS = {
  short: 60,    // 2 seconds
  medium: 90,   // 3 seconds
  long: 150,    // 5 seconds
  brief: 30     // 1 second
};

/**
 * Create a new text clip with defaults
 */
function createTextClip(text, startInFrames = 0, durationInFrames = COMMON_DURATIONS.medium, style = {}) {
  return {
    id: generateClipId('text'),
    text: text,
    startInFrames: startInFrames,
    durationInFrames: durationInFrames,
    style: { ...DEFAULT_TEXT_STYLE, ...style },
    effects: []
  };
}

/**
 * Create a new video clip with defaults
 */
function createVideoClip(assetUrl, startInFrames = 0, durationInFrames = 300) {
  return {
    id: generateClipId('video'),
    assetUrl: assetUrl,
    startInFrames: startInFrames,
    durationInFrames: durationInFrames,
    effects: []
  };
}

/**
 * Find a clip by ID in timeline
 */
function findClipById(timeline, clipId) {
  for (const track of timeline.timeline) {
    const clip = track.clips.find(c => c.id === clipId);
    if (clip) return { track, clip };
  }
  return null;
}

/**
 * Find a track by ID in timeline
 */
function findTrackById(timeline, trackId) {
  return timeline.timeline.find(track => track.id === trackId);
}

/**
 * Get next available track ID
 */
function getNextTrackId(timeline) {
  const existingNumbers = timeline.timeline
    .map(track => track.id.match(/track-(\d+)/))
    .filter(match => match)
    .map(match => parseInt(match[1]))
    .sort((a, b) => b - a);

  const nextNumber = existingNumbers.length > 0 ? existingNumbers[0] + 1 : 1;
  return `track-${nextNumber}`;
}

/**
 * Create a new track
 */
function createTrack(type, trackId = null) {
  return {
    id: trackId || `track-${Date.now()}`,
    type: type,
    clips: []
  };
}

/**
 * Add fade-in effect to clip
 */
function addFadeIn(clip, durationInFrames = 30) {
  const existingFadeIn = clip.effects?.find(e => e.type === 'fade-in');
  if (!existingFadeIn) {
    clip.effects = clip.effects || [];
    clip.effects.push({
      type: 'fade-in',
      durationInFrames: durationInFrames
    });
  }
  return clip;
}

/**
 * Add fade-out effect to clip
 */
function addFadeOut(clip, durationInFrames = 30) {
  const existingFadeOut = clip.effects?.find(e => e.type === 'fade-out');
  if (!existingFadeOut) {
    clip.effects = clip.effects || [];
    clip.effects.push({
      type: 'fade-out',
      durationInFrames: durationInFrames
    });
  }
  return clip;
}

/**
 * Validate timeline structure
 */
function validateTimeline(timeline) {
  const errors = [];

  if (!timeline.project) {
    errors.push('Timeline missing project settings');
  }

  if (!timeline.timeline || !Array.isArray(timeline.timeline)) {
    errors.push('Timeline missing or invalid timeline array');
  }

  if (timeline.timeline) {
    timeline.timeline.forEach((track, trackIndex) => {
      if (!track.id || !track.type) {
        errors.push(`Track ${trackIndex} missing id or type`);
      }

      if (track.clips) {
        track.clips.forEach((clip, clipIndex) => {
          if (!clip.id) {
            errors.push(`Track ${track.id} clip ${clipIndex} missing id`);
          }
          if (typeof clip.startInFrames !== 'number') {
            errors.push(`Track ${track.id} clip ${clip.id} invalid startInFrames`);
          }
          if (typeof clip.durationInFrames !== 'number') {
            errors.push(`Track ${track.id} clip ${clip.id} invalid durationInFrames`);
          }
        });
      }
    });
  }

  return errors;
}

/**
 * Smart timeline operations based on user intent
 */
const TIMELINE_OPERATIONS = {
  // Change text content
  changeText: (timeline, oldText, newText) => {
    const modifiedTimeline = JSON.parse(JSON.stringify(timeline));
    for (const track of modifiedTimeline.timeline) {
      if (track.type === 'text') {
        for (const clip of track.clips) {
          if (clip.text && clip.text.toLowerCase().includes(oldText.toLowerCase())) {
            clip.text = newText;
          }
        }
      }
    }
    return modifiedTimeline;
  },

  // Add text overlay
  addTextOverlay: (timeline, text, position = 'beginning') => {
    const modifiedTimeline = JSON.parse(JSON.stringify(timeline));

    // Find or create text track
    let textTrack = modifiedTimeline.timeline.find(t => t.type === 'text');
    if (!textTrack) {
      textTrack = createTrack('text', getNextTrackId(modifiedTimeline));
      modifiedTimeline.timeline.push(textTrack);
    }

    const startFrame = position === 'beginning' ? 0 :
                      position === 'middle' ? 150 : 300;

    const newClip = createTextClip(text, startFrame);
    addFadeIn(newClip, 15);

    textTrack.clips.push(newClip);
    return modifiedTimeline;
  },

  // Change text color
  changeTextColor: (timeline, color) => {
    const modifiedTimeline = JSON.parse(JSON.stringify(timeline));
    for (const track of modifiedTimeline.timeline) {
      if (track.type === 'text') {
        for (const clip of track.clips) {
          if (clip.style) {
            clip.style.color = color;
          }
        }
      }
    }
    return modifiedTimeline;
  }
};

module.exports = {
  generateClipId,
  secondsToFrames,
  framesToSeconds,
  DEFAULT_PROJECT,
  DEFAULT_TEXT_STYLE,
  COMMON_DURATIONS,
  createTextClip,
  createVideoClip,
  findClipById,
  findTrackById,
  getNextTrackId,
  createTrack,
  addFadeIn,
  addFadeOut,
  validateTimeline,
  TIMELINE_OPERATIONS
};