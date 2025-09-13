import { useState } from 'react';
import { EditorPlayer } from './components/EditorPlayer';
import { ChatPanel } from './components/ChatPanel';
import type { VideoTimeline } from './types/timeline';
import timelineData from './data/timeline.json';

function App() {
  const [timeline, setTimeline] = useState<VideoTimeline>(timelineData as VideoTimeline);

  const handleTimelineUpdate = (newTimeline: VideoTimeline) => {
    setTimeline(newTimeline);
  };

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
      </div>
      <ChatPanel timeline={timeline} onTimelineUpdate={handleTimelineUpdate} />
    </div>
  );
}

export default App;
