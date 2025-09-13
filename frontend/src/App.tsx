import { Timeline } from "./components/Timeline/Timeline";
import { VideoPreview } from "./components/VideoPreview";
import { ChatPanel } from './components/ChatPanel';
import "./App.css";

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Vibe Movie Editor</h1>
      </header>
      <main className="app-main">
        <div className="editor-content">
          <div className="video-preview-container">
            <VideoPreview />
          </div>
          <div className="timeline-container">
            <Timeline />
          </div>
        </div>
        <ChatPanel />
      </main>
    </div>
  );
}

export default App;
