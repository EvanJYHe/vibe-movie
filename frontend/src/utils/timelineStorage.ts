import type { VideoTimeline } from '../types/timeline';

const TIMELINE_STORAGE_KEY = 'vibe-movie-timeline';

/**
 * Timeline storage utility for persisting timeline data in localStorage
 */
export const timelineStorage = {
  /**
   * Save timeline to localStorage
   */
  saveTimeline: (timeline: VideoTimeline): void => {
    try {
      const timelineJson = JSON.stringify(timeline);
      localStorage.setItem(TIMELINE_STORAGE_KEY, timelineJson);
    } catch (error) {
      console.warn('Failed to save timeline to localStorage:', error);
    }
  },

  /**
   * Load timeline from localStorage
   * Returns null if no timeline is stored or if parsing fails
   */
  loadTimeline: (): VideoTimeline | null => {
    try {
      const timelineJson = localStorage.getItem(TIMELINE_STORAGE_KEY);
      if (!timelineJson) return null;
      
      const timeline = JSON.parse(timelineJson);
      // Basic validation to ensure it's a valid timeline structure
      if (timeline && timeline.project && timeline.timeline && Array.isArray(timeline.timeline)) {
        return timeline as VideoTimeline;
      }
      return null;
    } catch (error) {
      console.warn('Failed to load timeline from localStorage:', error);
      return null;
    }
  },

  /**
   * Clear stored timeline
   */
  clearTimeline: (): void => {
    try {
      localStorage.removeItem(TIMELINE_STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear timeline from localStorage:', error);
    }
  },

  /**
   * Check if a timeline is stored
   */
  hasStoredTimeline: (): boolean => {
    try {
      return localStorage.getItem(TIMELINE_STORAGE_KEY) !== null;
    } catch (error) {
      return false;
    }
  }
};
