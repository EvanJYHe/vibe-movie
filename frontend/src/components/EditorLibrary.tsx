import { useMemo, useState, type CSSProperties, type KeyboardEvent } from "react";
import { useDraggable } from "@dnd-kit/core";
import { useShallow } from "zustand/react/shallow";
import type { MediaAsset } from "../types/timeline";
import { useTimelineStore } from "../stores/timelineStore";
import { MediaUpload } from "./Timeline/MediaUpload";
import { TextEditor } from "./Timeline/TextEditor";
import { StudioIcon } from "./StudioIcon";
import "./EditorLibrary.css";

export type LibraryPanel = "media" | "text" | "audio" | "captions";

interface EditorLibraryProps {
  activePanel: LibraryPanel;
  onOpenDirector: () => void;
}

const panelTitles: Record<LibraryPanel, string> = {
  media: "My Media",
  text: "Titles",
  audio: "Audio",
  captions: "Captions",
};

function getAssetName(asset: MediaAsset) {
  if (asset.name) return asset.name;
  const rawName = asset.url.split("/").pop()?.split("?")[0] || "Untitled asset";
  try {
    return decodeURIComponent(rawName);
  } catch {
    return rawName;
  }
}

function formatDuration(seconds: number) {
  const safeSeconds = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = Math.floor(safeSeconds % 60);
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(
    2,
    "0"
  )}`;
}

interface AssetCardProps {
  asset: MediaAsset;
  isSelected: boolean;
  onAdd: () => void;
  onDelete: () => void;
  onSelect: () => void;
}

function AssetCard({
  asset,
  isSelected,
  onAdd,
  onDelete,
  onSelect,
}: AssetCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `asset-${asset.id}`,
      data: { asset },
    });

  const style: CSSProperties = {
    opacity: isDragging ? 0.5 : 1,
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      onAdd();
    }
  };

  const resolution =
    asset.width && asset.height
      ? `${asset.width >= 3000 ? "4K" : `${asset.height}p`}`
      : asset.type === "audio"
      ? "Stereo"
      : "Media";

  return (
    <article
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      aria-label={`${getAssetName(asset)}. Drag to a track or press Enter to add at the playhead.`}
      aria-selected={isSelected}
      className={`asset-card ${isDragging ? "is-dragging" : ""}`}
      onClick={onSelect}
      onDoubleClick={onAdd}
      onKeyDown={handleKeyDown}
      role="button"
      style={style}
      tabIndex={0}
    >
      <div
        className={`asset-card__thumb asset-card__thumb--${asset.type}`}
        data-duration={formatDuration(asset.duration)}
      >
        {asset.thumbnailUrl ? (
          <img alt="" src={asset.thumbnailUrl} />
        ) : (
          <StudioIcon
            name={
              asset.type === "audio"
                ? "wave"
                : asset.type === "video"
                ? "video"
                : "media"
            }
            size={22}
          />
        )}
      </div>
      <span className="asset-card__name">{getAssetName(asset)}</span>
      <span className="asset-card__meta">
        {resolution} · {asset.type}
      </span>
      <div className="asset-card__actions">
        <button
          aria-label={`Add ${getAssetName(asset)} at playhead`}
          className="asset-card__action"
          onClick={(event) => {
            event.stopPropagation();
            onAdd();
          }}
          onPointerDown={(event) => event.stopPropagation()}
          title="Add at playhead"
          type="button"
        >
          <StudioIcon name="plus" size={13} />
        </button>
        <button
          aria-label={`Remove ${getAssetName(asset)}`}
          className="asset-card__action asset-card__action--danger"
          onClick={(event) => {
            event.stopPropagation();
            onDelete();
          }}
          onPointerDown={(event) => event.stopPropagation()}
          title="Remove asset"
          type="button"
        >
          <StudioIcon name="trash" size={13} />
        </button>
      </div>
    </article>
  );
}

export function EditorLibrary({
  activePanel,
  onOpenDirector,
}: EditorLibraryProps) {
  const {
    assets,
    tracks,
    addAsset,
    addClipFromAsset,
    removeAsset,
  } = useTimelineStore(
    useShallow((state) => ({
      assets: state.assets,
      tracks: state.tracks,
      addAsset: state.addAsset,
      addClipFromAsset: state.addClipFromAsset,
      removeAsset: state.removeAsset,
    }))
  );
  const [query, setQuery] = useState("");
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [showTextEditor, setShowTextEditor] = useState(false);

  const visibleAssets = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return assets.filter((asset) => {
      if (activePanel === "audio" && asset.type !== "audio") return false;
      if (activePanel !== "media" && activePanel !== "audio") return false;
      return (
        !normalizedQuery ||
        getAssetName(asset).toLowerCase().includes(normalizedQuery)
      );
    });
  }, [activePanel, assets, query]);

  const addAssetAtPlayhead = (asset: MediaAsset) => {
    const targetTrack = tracks.find((track) => !track.locked);
    if (!targetTrack) return;
    const playheadPosition = useTimelineStore.getState().playheadPosition;
    addClipFromAsset(targetTrack.id, playheadPosition, asset);
  };

  return (
    <aside className="editor-library" aria-label="Asset library">
      <header className="editor-library__header">
        <h2>{panelTitles[activePanel]}</h2>
      </header>

      {(activePanel === "media" || activePanel === "audio") && (
        <>
          <div className="editor-library__tools">
            <label className="asset-search">
              <span className="sr-only">Search project assets</span>
              <StudioIcon name="search" size={14} />
              <input
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search this project"
                type="search"
                value={query}
              />
            </label>
          </div>
          <section className="editor-library__panel">
            {visibleAssets.length > 0 ? (
              <div className="asset-grid">
                {visibleAssets.map((asset) => (
                  <AssetCard
                    asset={asset}
                    isSelected={selectedAssetId === asset.id}
                    key={asset.id}
                    onAdd={() => addAssetAtPlayhead(asset)}
                    onDelete={() => {
                      if (
                        window.confirm(
                          `Remove "${getAssetName(asset)}" and its timeline clips?`
                        )
                      ) {
                        removeAsset(asset.id);
                      }
                    }}
                    onSelect={() => setSelectedAssetId(asset.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="library-empty">
                <h3>
                  {query
                    ? "No matching assets"
                    : activePanel === "audio"
                    ? "No audio yet"
                    : "No media yet"}
                </h3>
                <p>
                  {query
                    ? "Try a different search."
                    : "Import video, images, or audio to begin."}
                </p>
                {!query && (
                  <button
                    className="quiet-control"
                    onClick={() => setShowUpload(true)}
                    type="button"
                  >
                    <StudioIcon name="upload" size={14} />
                    Import media
                  </button>
                )}
              </div>
            )}
          </section>
        </>
      )}

      {activePanel === "text" && (
        <section className="editor-library__panel">
          <div className="preset-list">
            {[
              ["Film title", "Display / 72"],
              ["Lower third", "Body / 36"],
              ["Location card", "Mono / 28"],
              ["End credit", "Body / 32"],
            ].map(([name, meta]) => (
              <button
                className="preset-row"
                key={name}
                onClick={() => setShowTextEditor(true)}
                type="button"
              >
                <span>{name}</span>
                <span>{meta}</span>
              </button>
            ))}
          </div>
          <p className="library-hint">
            Text clips remain editable on the timeline after you place them.
          </p>
        </section>
      )}

      {activePanel === "captions" && (
        <section className="editor-library__panel">
          <div className="caption-card">
            <StudioIcon name="caption" size={22} />
            <h3>Build captions from the cut</h3>
            <p>
              Ask AI to draft, time, or restyle captions against the
              active sequence.
            </p>
            <button
              className="quiet-control"
              onClick={onOpenDirector}
              type="button"
            >
              <StudioIcon name="direct" size={14} />
              Open AI
            </button>
          </div>
        </section>
      )}

      {showUpload && (
        <MediaUpload
          onClose={() => setShowUpload(false)}
          onUpload={addAsset}
        />
      )}
      {showTextEditor && (
        <TextEditor
          isOpen={showTextEditor}
          onClose={() => setShowTextEditor(false)}
        />
      )}
    </aside>
  );
}
