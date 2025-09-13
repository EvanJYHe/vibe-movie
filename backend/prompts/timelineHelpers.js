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
 * Validate timeline structure with advanced safety checks
 */
function validateTimeline(timeline) {
  const errors = [];
  const warnings = [];

  if (!timeline.project) {
    errors.push('Timeline missing project settings');
  } else {
    // Validate project settings
    const { width, height, fps } = timeline.project;
    if (!width || !height || !fps) {
      errors.push('Project missing width, height, or fps');
    }
    if (fps <= 0 || fps > 120) {
      warnings.push(`Unusual fps value: ${fps}`);
    }
  }

  if (!timeline.timeline || !Array.isArray(timeline.timeline)) {
    errors.push('Timeline missing or invalid timeline array');
    return { errors, warnings };
  }

  // Track-level validation
  const trackIds = new Set();
  timeline.timeline.forEach((track, trackIndex) => {
    if (!track.id || !track.type) {
      errors.push(`Track ${trackIndex} missing id or type`);
    }

    // Check for duplicate track IDs
    if (trackIds.has(track.id)) {
      errors.push(`Duplicate track ID: ${track.id}`);
    } else {
      trackIds.add(track.id);
    }

    // Validate track type
    if (!['video', 'text'].includes(track.type)) {
      errors.push(`Track ${track.id} has invalid type: ${track.type}`);
    }

    if (track.clips) {
      validateTrackClips(track, errors, warnings);
    }
  });

  return { errors, warnings };
}

/**
 * Validate clips within a track
 */
function validateTrackClips(track, errors, warnings) {
  const clipIds = new Set();

  track.clips.forEach((clip, clipIndex) => {
    // Basic clip validation
    if (!clip.id) {
      errors.push(`Track ${track.id} clip ${clipIndex} missing id`);
    }

    // Check for duplicate clip IDs
    if (clipIds.has(clip.id)) {
      errors.push(`Duplicate clip ID in track ${track.id}: ${clip.id}`);
    } else {
      clipIds.add(clip.id);
    }

    // Validate timing
    if (typeof clip.startInFrames !== 'number') {
      errors.push(`Track ${track.id} clip ${clip.id} invalid startInFrames`);
    }
    if (typeof clip.durationInFrames !== 'number') {
      errors.push(`Track ${track.id} clip ${clip.id} invalid durationInFrames`);
    }

    // Check for negative or zero duration
    if (clip.durationInFrames <= 0) {
      errors.push(`Track ${track.id} clip ${clip.id} has non-positive duration`);
    }

    // Check for negative start frames
    if (clip.startInFrames < 0) {
      errors.push(`Track ${track.id} clip ${clip.id} has negative start frame`);
    }

    // Type-specific validation
    if (track.type === 'text') {
      validateTextClip(clip, track.id, errors, warnings);
    } else if (track.type === 'video') {
      validateVideoClip(clip, track.id, errors, warnings);
    }

    // Validate effects
    if (clip.effects) {
      validateClipEffects(clip, track.id, errors, warnings);
    }
  });

  // Check for overlapping clips in video tracks
  if (track.type === 'video') {
    checkForOverlaps(track, warnings);
  }

  // Check for timeline gaps
  checkForGaps(track, warnings);
}

/**
 * Validate text clip specific properties
 */
function validateTextClip(clip, trackId, errors, warnings) {
  if (!clip.text || typeof clip.text !== 'string') {
    errors.push(`Track ${trackId} text clip ${clip.id} missing or invalid text`);
  }

  if (!clip.style) {
    warnings.push(`Track ${trackId} text clip ${clip.id} missing style`);
  } else {
    // Validate text style
    const requiredStyles = ['fontFamily', 'fontSize', 'color'];
    requiredStyles.forEach(style => {
      if (!clip.style[style]) {
        warnings.push(`Track ${trackId} text clip ${clip.id} missing style.${style}`);
      }
    });

    if (clip.style.fontSize && clip.style.fontSize < 12) {
      warnings.push(`Track ${trackId} text clip ${clip.id} very small font size: ${clip.style.fontSize}`);
    }
  }
}

/**
 * Validate video clip specific properties
 */
function validateVideoClip(clip, trackId, errors, warnings) {
  if (!clip.assetUrl || typeof clip.assetUrl !== 'string') {
    errors.push(`Track ${trackId} video clip ${clip.id} missing or invalid assetUrl`);
  }

  // Check for very long durations (over 30 minutes at 30fps)
  if (clip.durationInFrames > 54000) {
    warnings.push(`Track ${trackId} video clip ${clip.id} unusually long duration: ${clip.durationInFrames} frames`);
  }
}

/**
 * Validate clip effects
 */
function validateClipEffects(clip, trackId, errors, warnings) {
  const validEffectTypes = ['fade-in', 'fade-out', 'slide-in'];

  clip.effects.forEach((effect, effectIndex) => {
    if (!effect.type) {
      errors.push(`Track ${trackId} clip ${clip.id} effect ${effectIndex} missing type`);
    } else if (!validEffectTypes.includes(effect.type)) {
      warnings.push(`Track ${trackId} clip ${clip.id} unknown effect type: ${effect.type}`);
    }

    if (typeof effect.durationInFrames !== 'number' || effect.durationInFrames <= 0) {
      errors.push(`Track ${trackId} clip ${clip.id} effect ${effectIndex} invalid duration`);
    }

    // Check if effect duration exceeds clip duration
    if (effect.durationInFrames > clip.durationInFrames) {
      warnings.push(`Track ${trackId} clip ${clip.id} effect ${effectIndex} duration exceeds clip duration`);
    }
  });
}

/**
 * Check for overlapping clips in video tracks
 */
function checkForOverlaps(track, warnings) {
  const clips = [...track.clips].sort((a, b) => a.startInFrames - b.startInFrames);

  for (let i = 0; i < clips.length - 1; i++) {
    const currentClip = clips[i];
    const nextClip = clips[i + 1];
    const currentEnd = currentClip.startInFrames + currentClip.durationInFrames;

    if (currentEnd > nextClip.startInFrames) {
      warnings.push(`Track ${track.id} clips ${currentClip.id} and ${nextClip.id} overlap`);
    }
  }
}

/**
 * Check for significant gaps in timeline
 */
function checkForGaps(track, warnings) {
  const clips = [...track.clips].sort((a, b) => a.startInFrames - b.startInFrames);

  for (let i = 0; i < clips.length - 1; i++) {
    const currentClip = clips[i];
    const nextClip = clips[i + 1];
    const currentEnd = currentClip.startInFrames + currentClip.durationInFrames;
    const gap = nextClip.startInFrames - currentEnd;

    // Warn about gaps larger than 3 seconds (90 frames at 30fps)
    if (gap > 90) {
      warnings.push(`Track ${track.id} large gap between clips ${currentClip.id} and ${nextClip.id}: ${gap} frames`);
    }
  }
}

/**
 * Comprehensive timeline health check
 */
function performTimelineHealthCheck(timeline) {
  const validation = validateTimeline(timeline);
  const stats = calculateTimelineStats(timeline);

  return {
    isHealthy: validation.errors.length === 0,
    validation,
    stats,
    recommendations: generateRecommendations(validation, stats)
  };
}

/**
 * Calculate timeline statistics
 */
function calculateTimelineStats(timeline) {
  if (!timeline.timeline) return {};

  const stats = {
    totalTracks: timeline.timeline.length,
    totalClips: 0,
    videoClips: 0,
    textClips: 0,
    totalDuration: 0,
    averageClipDuration: 0
  };

  let clipDurations = [];

  timeline.timeline.forEach(track => {
    if (track.clips) {
      stats.totalClips += track.clips.length;

      if (track.type === 'video') {
        stats.videoClips += track.clips.length;
      } else if (track.type === 'text') {
        stats.textClips += track.clips.length;
      }

      track.clips.forEach(clip => {
        clipDurations.push(clip.durationInFrames);
        const clipEnd = clip.startInFrames + clip.durationInFrames;
        stats.totalDuration = Math.max(stats.totalDuration, clipEnd);
      });
    }
  });

  if (clipDurations.length > 0) {
    stats.averageClipDuration = clipDurations.reduce((sum, dur) => sum + dur, 0) / clipDurations.length;
  }

  return stats;
}

/**
 * Generate timeline recommendations
 */
function generateRecommendations(validation, stats) {
  const recommendations = [];

  if (validation.warnings.length > 0) {
    recommendations.push('Review validation warnings for potential issues');
  }

  if (stats.totalClips === 0) {
    recommendations.push('Timeline is empty - add some clips to get started');
  }

  if (stats.videoClips === 0 && stats.textClips > 0) {
    recommendations.push('Consider adding background video or images for text overlays');
  }

  if (stats.averageClipDuration < 60) { // Less than 2 seconds at 30fps
    recommendations.push('Clips are quite short - consider longer durations for better readability');
  }

  if (stats.totalTracks > 5) {
    recommendations.push('Many tracks detected - consider consolidating for better performance');
  }

  return recommendations;
}

/**
 * Cut clip at specific frame position, creating two separate clips
 */
function cutClipAt(timeline, clipId, cutFrame) {
  const modifiedTimeline = JSON.parse(JSON.stringify(timeline));

  for (const track of modifiedTimeline.timeline) {
    const clipIndex = track.clips.findIndex(c => c.id === clipId);
    if (clipIndex !== -1) {
      const originalClip = track.clips[clipIndex];
      const cutPosition = cutFrame - originalClip.startInFrames;

      // Validate cut position
      if (cutPosition <= 0 || cutPosition >= originalClip.durationInFrames) {
        throw new Error('Cut position must be within clip duration');
      }

      // Create first clip (before cut)
      const firstClip = {
        ...originalClip,
        id: generateClipId(track.type),
        durationInFrames: cutPosition
      };

      // Create second clip (after cut)
      const secondClip = {
        ...originalClip,
        id: generateClipId(track.type),
        startInFrames: cutFrame,
        durationInFrames: originalClip.durationInFrames - cutPosition
      };

      // Replace original clip with two new clips
      track.clips[clipIndex] = firstClip;
      track.clips.splice(clipIndex + 1, 0, secondClip);

      return modifiedTimeline;
    }
  }

  throw new Error(`Clip with ID ${clipId} not found`);
}

/**
 * Trim clip from the start, removing frames before specified frame
 */
function trimClipStart(timeline, clipId, newStartFrame) {
  const modifiedTimeline = JSON.parse(JSON.stringify(timeline));

  for (const track of modifiedTimeline.timeline) {
    const clip = track.clips.find(c => c.id === clipId);
    if (clip) {
      const originalEnd = clip.startInFrames + clip.durationInFrames;

      if (newStartFrame >= originalEnd) {
        throw new Error('New start frame would eliminate entire clip');
      }

      clip.durationInFrames = originalEnd - newStartFrame;
      clip.startInFrames = newStartFrame;

      return modifiedTimeline;
    }
  }

  throw new Error(`Clip with ID ${clipId} not found`);
}

/**
 * Trim clip from the end, removing frames after specified frame
 */
function trimClipEnd(timeline, clipId, newEndFrame) {
  const modifiedTimeline = JSON.parse(JSON.stringify(timeline));

  for (const track of modifiedTimeline.timeline) {
    const clip = track.clips.find(c => c.id === clipId);
    if (clip) {
      if (newEndFrame <= clip.startInFrames) {
        throw new Error('New end frame would eliminate entire clip');
      }

      clip.durationInFrames = newEndFrame - clip.startInFrames;

      return modifiedTimeline;
    }
  }

  throw new Error(`Clip with ID ${clipId} not found`);
}

/**
 * Extract a specific range from a clip, keeping only the specified segment
 */
function trimClipRange(timeline, clipId, startFrame, endFrame) {
  const modifiedTimeline = JSON.parse(JSON.stringify(timeline));

  for (const track of modifiedTimeline.timeline) {
    const clip = track.clips.find(c => c.id === clipId);
    if (clip) {
      const originalStart = clip.startInFrames;
      const originalEnd = clip.startInFrames + clip.durationInFrames;

      // Validate range
      if (startFrame < originalStart || endFrame > originalEnd || startFrame >= endFrame) {
        throw new Error('Invalid trim range');
      }

      clip.startInFrames = startFrame;
      clip.durationInFrames = endFrame - startFrame;

      return modifiedTimeline;
    }
  }

  throw new Error(`Clip with ID ${clipId} not found`);
}

/**
 * Remove frames from middle of clip, creating a gap
 */
function removeClipSegment(timeline, clipId, removeStartFrame, removeEndFrame) {
  const modifiedTimeline = JSON.parse(JSON.stringify(timeline));

  for (const track of modifiedTimeline.timeline) {
    const clipIndex = track.clips.findIndex(c => c.id === clipId);
    if (clipIndex !== -1) {
      const originalClip = track.clips[clipIndex];
      const originalStart = originalClip.startInFrames;
      const originalEnd = originalClip.startInFrames + originalClip.durationInFrames;

      // Validate remove range
      if (removeStartFrame < originalStart || removeEndFrame > originalEnd || removeStartFrame >= removeEndFrame) {
        throw new Error('Invalid remove range');
      }

      // If removing from start
      if (removeStartFrame === originalStart) {
        return trimClipStart(timeline, clipId, removeEndFrame);
      }

      // If removing from end
      if (removeEndFrame === originalEnd) {
        return trimClipEnd(timeline, clipId, removeStartFrame);
      }

      // Removing from middle - split into two clips
      const firstClip = {
        ...originalClip,
        id: generateClipId(track.type),
        durationInFrames: removeStartFrame - originalStart
      };

      const secondClip = {
        ...originalClip,
        id: generateClipId(track.type),
        startInFrames: removeEndFrame,
        durationInFrames: originalEnd - removeEndFrame
      };

      // Replace original clip with two new clips
      track.clips[clipIndex] = firstClip;
      track.clips.splice(clipIndex + 1, 0, secondClip);

      return modifiedTimeline;
    }
  }

  throw new Error(`Clip with ID ${clipId} not found`);
}

/**
 * Join multiple sequential clips into a single clip (same track, compatible types)
 */
function joinClips(timeline, clipIds) {
  const modifiedTimeline = JSON.parse(JSON.stringify(timeline));

  if (clipIds.length < 2) {
    throw new Error('Need at least 2 clips to join');
  }

  // Find all clips and verify they're on the same track
  const clipData = [];
  let targetTrack = null;

  for (const track of modifiedTimeline.timeline) {
    for (const clip of track.clips) {
      if (clipIds.includes(clip.id)) {
        if (!targetTrack) {
          targetTrack = track;
        } else if (track !== targetTrack) {
          throw new Error('Cannot join clips from different tracks');
        }
        clipData.push(clip);
      }
    }
  }

  if (clipData.length !== clipIds.length) {
    throw new Error('Some clips not found');
  }

  // Verify clips are compatible (same type)
  if (clipData.some(clip => targetTrack.type === 'text' && !clip.text) ||
      clipData.some(clip => targetTrack.type === 'video' && !clip.assetUrl)) {
    throw new Error('Clips must be of compatible types for joining');
  }

  // Sort clips by start time
  clipData.sort((a, b) => a.startInFrames - b.startInFrames);

  // Calculate new clip properties
  const startFrame = clipData[0].startInFrames;
  const lastClip = clipData[clipData.length - 1];
  const endFrame = lastClip.startInFrames + lastClip.durationInFrames;
  const totalDuration = endFrame - startFrame;

  // Create new joined clip based on first clip
  const joinedClip = {
    ...clipData[0],
    id: generateClipId(targetTrack.type),
    startInFrames: startFrame,
    durationInFrames: totalDuration
  };

  // For text clips, concatenate text content
  if (targetTrack.type === 'text') {
    joinedClip.text = clipData.map(clip => clip.text).join(' ');
  }

  // Remove original clips and add joined clip
  targetTrack.clips = targetTrack.clips.filter(clip => !clipIds.includes(clip.id));
  targetTrack.clips.push(joinedClip);

  return modifiedTimeline;
}

/**
 * Merge video clips with crossfade transition
 */
function mergeVideoClips(timeline, clipIds, crossfadeDuration = 30) {
  const modifiedTimeline = JSON.parse(JSON.stringify(timeline));

  if (clipIds.length < 2) {
    throw new Error('Need at least 2 clips to merge');
  }

  // Find and validate video clips
  const clipData = [];
  let targetTrack = null;

  for (const track of modifiedTimeline.timeline) {
    if (track.type !== 'video') continue;

    for (const clip of track.clips) {
      if (clipIds.includes(clip.id)) {
        targetTrack = track;
        clipData.push(clip);
      }
    }
  }

  if (clipData.length !== clipIds.length) {
    throw new Error('Some video clips not found');
  }

  // Sort clips by start time
  clipData.sort((a, b) => a.startInFrames - b.startInFrames);

  // Calculate merged clip properties
  const startFrame = clipData[0].startInFrames;
  const lastClip = clipData[clipData.length - 1];
  const endFrame = lastClip.startInFrames + lastClip.durationInFrames;

  // Account for crossfade overlaps
  const totalDuration = endFrame - startFrame - ((clipData.length - 1) * crossfadeDuration);

  // Create merged clip
  const mergedClip = {
    ...clipData[0],
    id: generateClipId('video'),
    startInFrames: startFrame,
    durationInFrames: totalDuration,
    effects: [
      ...clipData[0].effects || [],
      { type: 'fade-in', durationInFrames: 15 },
      { type: 'fade-out', durationInFrames: 15 }
    ]
  };

  // Remove original clips and add merged clip
  targetTrack.clips = targetTrack.clips.filter(clip => !clipIds.includes(clip.id));
  targetTrack.clips.push(mergedClip);

  return modifiedTimeline;
}

/**
 * Concatenate clips end-to-end (no overlap, no gaps)
 */
function concatenateClips(timeline, clipIds) {
  const modifiedTimeline = JSON.parse(JSON.stringify(timeline));

  if (clipIds.length < 2) {
    throw new Error('Need at least 2 clips to concatenate');
  }

  // Find clips and verify they're on same track
  const clipData = [];
  let targetTrack = null;

  for (const track of modifiedTimeline.timeline) {
    for (const clip of track.clips) {
      if (clipIds.includes(clip.id)) {
        if (!targetTrack) {
          targetTrack = track;
        } else if (track !== targetTrack) {
          throw new Error('Cannot concatenate clips from different tracks');
        }
        clipData.push(clip);
      }
    }
  }

  if (clipData.length !== clipIds.length) {
    throw new Error('Some clips not found');
  }

  // Sort clips by start time
  clipData.sort((a, b) => a.startInFrames - b.startInFrames);

  // Position clips end-to-end
  let currentPosition = clipData[0].startInFrames;

  for (let i = 0; i < clipData.length; i++) {
    clipData[i].startInFrames = currentPosition;
    currentPosition += clipData[i].durationInFrames;
  }

  // Create concatenated clip
  const totalDuration = clipData.reduce((sum, clip) => sum + clip.durationInFrames, 0);

  const concatenatedClip = {
    ...clipData[0],
    id: generateClipId(targetTrack.type),
    startInFrames: clipData[0].startInFrames,
    durationInFrames: totalDuration
  };

  // For text clips, concatenate content
  if (targetTrack.type === 'text') {
    concatenatedClip.text = clipData.map(clip => clip.text).join(' ');
  }

  // Remove original clips and add concatenated clip
  targetTrack.clips = targetTrack.clips.filter(clip => !clipIds.includes(clip.id));
  targetTrack.clips.push(concatenatedClip);

  return modifiedTimeline;
}

/**
 * Move clip to different position in timeline
 */
function moveClipToPosition(timeline, clipId, newStartFrame) {
  const modifiedTimeline = JSON.parse(JSON.stringify(timeline));

  for (const track of modifiedTimeline.timeline) {
    const clip = track.clips.find(c => c.id === clipId);
    if (clip) {
      if (newStartFrame < 0) {
        throw new Error('Start frame cannot be negative');
      }

      clip.startInFrames = newStartFrame;
      return modifiedTimeline;
    }
  }

  throw new Error(`Clip with ID ${clipId} not found`);
}

/**
 * Duplicate clip at specified position
 */
function duplicateClip(timeline, clipId, newStartFrame) {
  const modifiedTimeline = JSON.parse(JSON.stringify(timeline));

  for (const track of modifiedTimeline.timeline) {
    const clip = track.clips.find(c => c.id === clipId);
    if (clip) {
      const duplicatedClip = {
        ...clip,
        id: generateClipId(track.type),
        startInFrames: newStartFrame
      };

      track.clips.push(duplicatedClip);
      return modifiedTimeline;
    }
  }

  throw new Error(`Clip with ID ${clipId} not found`);
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
  },

  // Advanced clip operations
  cutClip: (timeline, clipId, cutTimeSeconds, fps = 30) => {
    const cutFrame = secondsToFrames(cutTimeSeconds, fps);
    return cutClipAt(timeline, clipId, cutFrame);
  },

  trimClipFromStart: (timeline, clipId, trimSeconds, fps = 30) => {
    const clipData = findClipById(timeline, clipId);
    if (clipData) {
      const newStartFrame = clipData.clip.startInFrames + secondsToFrames(trimSeconds, fps);
      return trimClipStart(timeline, clipId, newStartFrame);
    }
    throw new Error(`Clip with ID ${clipId} not found`);
  },

  trimClipFromEnd: (timeline, clipId, trimSeconds, fps = 30) => {
    const clipData = findClipById(timeline, clipId);
    if (clipData) {
      const newEndFrame = clipData.clip.startInFrames + clipData.clip.durationInFrames - secondsToFrames(trimSeconds, fps);
      return trimClipEnd(timeline, clipId, newEndFrame);
    }
    throw new Error(`Clip with ID ${clipId} not found`);
  },

  joinMultipleClips: (timeline, clipIds) => {
    return joinClips(timeline, clipIds);
  },

  mergeWithCrossfade: (timeline, clipIds, crossfadeSeconds = 1, fps = 30) => {
    const crossfadeDuration = secondsToFrames(crossfadeSeconds, fps);
    return mergeVideoClips(timeline, clipIds, crossfadeDuration);
  },

  moveClip: (timeline, clipId, newTimeSeconds, fps = 30) => {
    const newStartFrame = secondsToFrames(newTimeSeconds, fps);
    return moveClipToPosition(timeline, clipId, newStartFrame);
  },

  duplicateClipAt: (timeline, clipId, newTimeSeconds, fps = 30) => {
    const newStartFrame = secondsToFrames(newTimeSeconds, fps);
    return duplicateClip(timeline, clipId, newStartFrame);
  },

  removeClipPortion: (timeline, clipId, startSeconds, endSeconds, fps = 30) => {
    const clipData = findClipById(timeline, clipId);
    if (clipData) {
      const removeStartFrame = clipData.clip.startInFrames + secondsToFrames(startSeconds, fps);
      const removeEndFrame = clipData.clip.startInFrames + secondsToFrames(endSeconds, fps);
      return removeClipSegment(timeline, clipId, removeStartFrame, removeEndFrame);
    }
    throw new Error(`Clip with ID ${clipId} not found`);
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
  // Advanced clip operations
  cutClipAt,
  trimClipStart,
  trimClipEnd,
  trimClipRange,
  removeClipSegment,
  joinClips,
  mergeVideoClips,
  concatenateClips,
  moveClipToPosition,
  duplicateClip,
  // Enhanced validation
  performTimelineHealthCheck,
  calculateTimelineStats,
  generateRecommendations,
  TIMELINE_OPERATIONS
};