import { useCallback, useMemo, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { useTimelineStore } from "../../stores/timelineStore";
import { convertTimelineToRemotionFormat } from "../../utils/timeline";
import { apiUrl } from "../../services/api";
import { StudioIcon } from "../StudioIcon";

interface ExportButtonProps {
  variant?: "topbar" | "toolbar";
}

export function ExportButton({ variant = "toolbar" }: ExportButtonProps) {
  const { tracks, assets } = useTimelineStore(
    useShallow((state) => ({
      tracks: state.tracks,
      assets: state.assets,
    }))
  );
  const [showDialog, setShowDialog] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportError, setExportError] = useState<string | null>(null);

  const clipCount = useMemo(
    () => tracks.reduce((sum, track) => sum + track.clips.length, 0),
    [tracks]
  );
  const sequenceDuration = useMemo(
    () =>
      tracks.reduce(
        (end, track) =>
          Math.max(
            end,
            ...track.clips.map((clip) => clip.startTime + clip.duration)
          ),
        0
      ),
    [tracks]
  );

  const handleExport = useCallback(async () => {
    if (isExporting) return;

    const hasContent = tracks.some((track) => track.clips.length > 0);
    if (!hasContent) {
      setExportError("Add at least one clip before exporting this sequence.");
      return;
    }

    setIsExporting(true);
    setExportProgress(8);
    setExportError(null);

    try {
      const remotionTimeline = convertTimelineToRemotionFormat(tracks, assets);
      const formData = new FormData();
      formData.append("timeline", JSON.stringify(remotionTimeline));

      const assetPromises = new Map<string, Promise<void>>();
      const assetMapping: Record<string, string> = {};

      for (const track of remotionTimeline.timeline) {
        for (const clip of track.clips) {
          if (
            clip.type !== "video" &&
            clip.type !== "audio" &&
            clip.type !== "image"
          ) {
            continue;
          }
          if (clip.assetUrl?.startsWith("blob:") && !assetPromises.has(clip.assetUrl)) {
            const assetUrl = clip.assetUrl;
            const assetPromise = fetch(assetUrl)
              .then((response) => response.blob())
              .then((blob) => {
                const extension =
                  blob.type.split("/")[1]?.replace("quicktime", "mov") ||
                  (clip.type === "audio" ? "mp3" : clip.type === "image" ? "png" : "mp4");
                const filename = `asset-${clip.id}.${extension}`;
                formData.append("assets", blob, filename);
                assetMapping[assetUrl] = filename;
              });
            assetPromises.set(assetUrl, assetPromise);
          }
        }
      }

      await Promise.all(assetPromises.values());
      setExportProgress(32);

      const updatedTimeline = JSON.parse(JSON.stringify(remotionTimeline));
      for (const track of updatedTimeline.timeline) {
        for (const clip of track.clips) {
          if (clip.assetUrl && assetMapping[clip.assetUrl]) {
            clip.assetUrl = `/temp-assets/${
              assetMapping[clip.assetUrl]
            }`;
          }
        }
      }

      formData.set("timeline", JSON.stringify(updatedTimeline));
      setExportProgress(48);

      const response = await fetch(apiUrl("/api/export"), {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || "Export failed");
      }

      setExportProgress(82);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, "-")
        .slice(0, -5);
      link.download = `vibe-movie-export-${timestamp}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setExportProgress(100);
      setShowDialog(false);
    } catch (caughtError) {
      console.error("Export failed:", caughtError);
      setExportError(
        caughtError instanceof Error ? caughtError.message : "Export failed"
      );
    } finally {
      setIsExporting(false);
    }
  }, [assets, isExporting, tracks]);

  return (
    <>
      <button
        className={`export-trigger export-trigger--${variant}`}
        disabled={isExporting}
        onClick={() => {
          setExportError(null);
          setShowDialog(true);
        }}
        title="Export video"
        type="button"
      >
        <StudioIcon name="export" size={14} />
        <span>{isExporting ? "Exporting" : "Export"}</span>
      </button>

      {showDialog && (
        <div
          className="export-backdrop"
          onClick={() => !isExporting && setShowDialog(false)}
        >
          <section
            aria-labelledby="export-dialog-title"
            aria-modal="true"
            className="export-dialog"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <header className="export-dialog__header">
              <div>
                <span className="export-dialog__eyebrow">Delivery</span>
                <h2 id="export-dialog-title">Export sequence</h2>
              </div>
              <button
                aria-label="Close export dialog"
                className="close-btn"
                disabled={isExporting}
                onClick={() => setShowDialog(false)}
                type="button"
              >
                <StudioIcon name="x" size={14} />
              </button>
            </header>
            <div className="export-dialog__body">
              <p className="export-dialog__note">
                Render the active cut through Remotion and download a finished
                MP4.
              </p>
              <dl className="export-summary">
                <dt>Format</dt>
                <dd>MP4 · H.264</dd>
                <dt>Frame</dt>
                <dd>1920 × 1080</dd>
                <dt>Frame rate</dt>
                <dd>30 fps</dd>
                <dt>Sequence</dt>
                <dd>
                  {clipCount} {clipCount === 1 ? "clip" : "clips"} ·{" "}
                  {Math.round(sequenceDuration)}s
                </dd>
              </dl>
              {exportError && (
                <p className="export-dialog__error" role="alert">
                  {exportError}
                </p>
              )}
              {isExporting && (
                <div className="export-progress">
                  <span>Rendering frames · {exportProgress}%</span>
                  <div className="export-progress-bar">
                    <div
                      className="export-progress-fill"
                      style={{ width: `${exportProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
            <footer className="export-dialog__actions">
              <button
                className="btn btn-secondary"
                disabled={isExporting}
                onClick={() => setShowDialog(false)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="export-trigger"
                disabled={isExporting}
                onClick={() => void handleExport()}
                type="button"
              >
                <StudioIcon name="export" size={14} />
                <span>{isExporting ? "Rendering…" : "Start export"}</span>
              </button>
            </footer>
          </section>
        </div>
      )}
    </>
  );
}
