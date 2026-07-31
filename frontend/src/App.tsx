import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useState,
  type CSSProperties,
} from "react";
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  rectIntersection,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { Timeline } from "./components/Timeline/Timeline";
import { ExportButton } from "./components/Timeline/ExportButton";
import { VideoPreview } from "./components/VideoPreview";
import { ResizeHandle } from "./components/ResizeHandle";
import {
  EditorLibrary,
  type LibraryPanel,
} from "./components/EditorLibrary";
import {
  StudioIcon,
  type StudioIconName,
} from "./components/StudioIcon";
import { initStorage } from "./utils/storage";
import { useTimelineStore } from "./stores/timelineStore";
import type { Clip, MediaAsset, Track } from "./types/timeline";
import "./App.css";

const ChatPanel = lazy(() =>
  import("./components/ChatPanel").then(({ ChatPanel: Component }) => ({
    default: Component,
  }))
);

interface DragPayload {
  asset?: MediaAsset;
  clip?: Clip;
  trackId?: string;
}

interface DropPayload {
  track?: Track;
}

const libraryTools: Array<{
  id: LibraryPanel;
  label: string;
  icon: StudioIconName;
}> = [
  { id: "media", label: "Media", icon: "media" },
  { id: "audio", label: "Audio", icon: "audio" },
  { id: "text", label: "Titles", icon: "type" },
  { id: "captions", label: "Captions", icon: "caption" },
];

function getAssetLabel(asset: MediaAsset) {
  return asset.url.split("/").pop()?.split("?")[0] || "Media asset";
}

function App() {
  const [previewHeight, setPreviewHeight] = useState(56);
  const [activeLibrary, setActiveLibrary] = useState<LibraryPanel>("media");
  const [directorVisible, setDirectorVisible] = useState(false);
  const [dragActive, setDragActive] = useState<DragPayload | null>(null);

  const restoreMediaUrls = useTimelineStore((state) => state.restoreMediaUrls);
  const cleanupStorage = useTimelineStore((state) => state.cleanupStorage);
  const duration = useTimelineStore((state) => state.duration);
  const snapToGrid = useTimelineStore((state) => state.snapToGrid);
  const pixelsPerSecond = useTimelineStore((state) => state.pixelsPerSecond);
  const gridSize = useTimelineStore((state) => state.gridSize);
  const moveClip = useTimelineStore((state) => state.moveClip);
  const addClipFromAsset = useTimelineStore(
    (state) => state.addClipFromAsset
  );

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 140, tolerance: 8 },
    })
  );

  useEffect(() => {
    const initialize = async () => {
      try {
        await initStorage();
        await restoreMediaUrls();
        await cleanupStorage();
      } catch (error) {
        console.error("Failed to initialize storage:", error);
      }
    };

    void initialize();
  }, [restoreMediaUrls, cleanupStorage]);

  const handleVerticalResize = useCallback((mouseY: number) => {
    const workbench = document.querySelector<HTMLElement>(".workbench");
    if (!workbench) return;

    const rect = workbench.getBoundingClientRect();
    const percentage = ((mouseY - rect.top) / rect.height) * 100;
    setPreviewHeight(Math.max(28, Math.min(72, percentage)));
  }, []);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setDragActive((event.active.data.current as DragPayload | undefined) ?? null);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setDragActive(null);
      const { active, over } = event;
      if (!over) return;

      const activeData = active.data.current as DragPayload | undefined;
      const dropData = over.data.current as DropPayload | undefined;
      const targetTrack = dropData?.track;
      if (!activeData || !targetTrack) return;

      if (activeData.clip) {
        const shiftedStart =
          activeData.clip.startTime + event.delta.x / pixelsPerSecond;
        const snappedStart = snapToGrid
          ? Math.round(shiftedStart / gridSize) * gridSize
          : shiftedStart;
        moveClip(activeData.clip.id, targetTrack.id, Math.max(0, snappedStart));
        return;
      }

      if (activeData.asset) {
        const translatedRect = active.rect.current.translated;
        let startTime = useTimelineStore.getState().playheadPosition;

        if (translatedRect) {
          const droppedCenter = translatedRect.left + translatedRect.width / 2;
          startTime = (droppedCenter - over.rect.left) / pixelsPerSecond;
        }

        startTime = Math.max(0, Math.min(duration, startTime));
        if (snapToGrid) {
          startTime = Math.round(startTime / gridSize) * gridSize;
        }
        addClipFromAsset(targetTrack.id, startTime, activeData.asset);
      }
    },
    [
      addClipFromAsset,
      duration,
      gridSize,
      moveClip,
      pixelsPerSecond,
      snapToGrid,
    ]
  );

  const focusDirector = useCallback(() => {
    setDirectorVisible(true);
    window.setTimeout(() => {
      document
        .querySelector<HTMLTextAreaElement>(".chat-textarea")
        ?.focus({ preventScroll: true });
    }, 0);
  }, []);

  const workbenchStyle = {
    "--preview-height": `${previewHeight}fr`,
    "--timeline-height": `${100 - previewHeight}fr`,
  } as CSSProperties;

  return (
    <main className="editor" aria-label="Vibe Movie editing studio">
      <header className="topbar">
        <div className="topbar__left">
          <a className="project-mark" href="/" aria-label="Vibe Movie home">
            <img
              className="brand-mark"
              src="/vibe-film-gate-mark-v1.webp"
              alt=""
              width="30"
              height="30"
            />
            <span className="project-mark__name">Vibe Movie</span>
          </a>
          <div className="history-controls">
            <button
              aria-label="Undo unavailable"
              className="topbar-icon"
              disabled
              type="button"
            >
              <StudioIcon name="undo" />
            </button>
            <button
              aria-label="Redo unavailable"
              className="topbar-icon"
              disabled
              type="button"
            >
              <StudioIcon name="redo" />
            </button>
          </div>
        </div>
        <div className="topbar__right">
          <button
            aria-label="Toggle AI"
            aria-pressed={directorVisible}
            className="topbar-icon topbar-director"
            onClick={() =>
              directorVisible ? setDirectorVisible(false) : focusDirector()
            }
            title="Toggle AI"
            type="button"
          >
            <StudioIcon name="direct" size={15} />
            <span>AI</span>
          </button>
          <ExportButton variant="topbar" />
        </div>
      </header>

      <DndContext
        collisionDetection={rectIntersection}
        onDragEnd={handleDragEnd}
        onDragStart={handleDragStart}
        sensors={sensors}
      >
        <section
          className={`workbench ${
            directorVisible ? "" : "is-director-hidden"
          }`}
          style={workbenchStyle}
        >
          <nav className="modebar" aria-label="Media browser">
            {libraryTools.map((tool) => (
              <button
                aria-label={tool.label}
                aria-pressed={activeLibrary === tool.id}
                className="modebar__button"
                key={tool.id}
                onClick={() => setActiveLibrary(tool.id)}
                title={tool.label}
                type="button"
              >
                <StudioIcon name={tool.icon} size={18} />
                <span className="sr-only">{tool.label}</span>
              </button>
            ))}
          </nav>

          <EditorLibrary
            activePanel={activeLibrary}
            onOpenDirector={focusDirector}
          />

          <section className="preview-region">
            <VideoPreview />
          </section>

          <ResizeHandle
            className="preview-resize"
            direction="vertical"
            onResize={handleVerticalResize}
          />

          <section className="timeline-region">
            <Timeline />
          </section>

          {directorVisible && (
            <aside className="director-region">
              <Suspense fallback={null}>
                <ChatPanel width={360} />
              </Suspense>
            </aside>
          )}
        </section>

        <DragOverlay>
          {dragActive && (
            <div className="studio-drag-preview">
              <StudioIcon
                name={dragActive.asset ? "plus" : "pointer"}
                size={14}
              />
              <div>
                <strong>
                  {dragActive.asset
                    ? getAssetLabel(dragActive.asset)
                    : dragActive.clip?.name || "Timeline clip"}
                </strong>
                <span>
                  {dragActive.asset ? "Drop onto a track" : "Move clip"}
                </span>
              </div>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </main>
  );
}

export default App;
