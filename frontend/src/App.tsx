import { Timeline } from "./components/Timeline/Timeline";
import { VideoPreview } from "./components/VideoPreview";
import "./App.css";

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Vibe Movie</h1>
      </header>
      <main className="app-main">
        <div className="video-preview-container">
          <VideoPreview />
        </div>
        <div className="timeline-container">
          <Timeline />
        </div>
      </main>
    </div>
  );
}

export default App;
