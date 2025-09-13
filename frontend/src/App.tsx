import React, { useState, useCallback } from "react";
import { Timeline } from "./components/Timeline/Timeline";
import { VideoPreview } from "./components/VideoPreview";
import { ChatPanel } from "./components/ChatPanel";
import { ResizeHandle } from "./components/ResizeHandle";
import "./App.css";

function App() {
  const [previewHeight, setPreviewHeight] = useState(60); // percentage
  const [chatWidth, setChatWidth] = useState(400); // pixels

  const handleVerticalResize = useCallback((mouseY: number) => {
    const mainElement = document.querySelector(".app-main") as HTMLElement;
    if (!mainElement) return;

    const rect = mainElement.getBoundingClientRect();
    const relativeY = mouseY - rect.top;
    const percentage = (relativeY / rect.height) * 100;

    // Constrain between 20% and 80%
    setPreviewHeight(Math.max(20, Math.min(80, percentage)));
  }, []);

  const handleHorizontalResize = useCallback((mouseX: number) => {
    const appElement = document.querySelector(".app") as HTMLElement;
    if (!appElement) return;

    const rect = appElement.getBoundingClientRect();
    const distanceFromRight = rect.right - mouseX;

    // Constrain between 250px and 800px
    setChatWidth(Math.max(250, Math.min(800, distanceFromRight)));
  }, []);

  return (
    <div className="app">
      <main className="app-main">
        <div className="editor-content">
          <div
            className="video-preview-container"
            style={{ flex: `0 0 ${previewHeight}%` }}
          >
            <VideoPreview />
          </div>
          <ResizeHandle direction="vertical" onResize={handleVerticalResize} />
          <div
            className="timeline-container"
            style={{ flex: `0 0 ${100 - previewHeight}%` }}
          >
            <Timeline />
          </div>
        </div>
        <ResizeHandle
          direction="horizontal"
          onResize={handleHorizontalResize}
        />
        <ChatPanel width={chatWidth} />
      </main>
    </div>
  );
}

export default App;
