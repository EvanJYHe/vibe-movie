import { useState, useEffect } from 'react';
import { EditorPlayer } from './components/EditorPlayer';
import { ChatPanel } from './components/ChatPanel';
import { TimelineViewer } from './components/TimelineViewer';
import type { VideoTimeline } from './types/timeline';
import timelineData from './data/timeline.json';
import { timelineStorage } from './utils/timelineStorage';

function App() {
  // Load timeline from localStorage if available, otherwise use default
  const [timeline, setTimeline] = useState<VideoTimeline>(() => {
    const storedTimeline = timelineStorage.loadTimeline();
    return storedTimeline || (timelineData as VideoTimeline);
  });

  const handleTimelineUpdate = (newTimeline: VideoTimeline) => {
    setTimeline(newTimeline);
    // Persist timeline to localStorage whenever it's updated
    timelineStorage.saveTimeline(newTimeline);
  };

  // Save initial timeline if none was stored
  useEffect(() => {
    if (!timelineStorage.hasStoredTimeline()) {
      timelineStorage.saveTimeline(timeline);
    }
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      gap: '24px',
      padding: '24px',
      backgroundColor: '#f5f5f5',
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
      }}>
        <h1 style={{
          margin: 0,
          fontSize: '24px',
          fontWeight: '600',
          color: '#333',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}>
          Vibe Movie Editor
        </h1>
        <EditorPlayer timeline={timeline} />
        <TimelineViewer timeline={timeline} onTimelineUpdate={handleTimelineUpdate} />
      </div>
      <ChatPanel timeline={timeline} onTimelineUpdate={handleTimelineUpdate} />
    </div>
  );
}

export default App;
