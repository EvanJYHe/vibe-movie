import React, { useState, useCallback } from 'react';
import { useTimelineStore } from '../../stores/timelineStore';
import { convertTimelineToRemotionFormat } from '../../utils/timeline';

export const ExportButton: React.FC = () => {
  const { tracks, assets } = useTimelineStore();
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const handleExport = useCallback(async () => {
    if (isExporting) return;
    
    // Check if there's content to export
    const hasContent = tracks.some(track => track.clips.length > 0);
    if (!hasContent) {
      alert('Please add some clips to the timeline before exporting.');
      return;
    }

    setIsExporting(true);
    setExportProgress(0);

    try {
      // Convert timeline to Remotion format
      const remotionTimeline = convertTimelineToRemotionFormat(tracks, assets);
      
      console.log('Exporting timeline:', remotionTimeline);

      // Create FormData to handle both timeline and asset files
      const formData = new FormData();
      formData.append('timeline', JSON.stringify(remotionTimeline));

      // Upload blob assets that need to be accessible server-side
      const assetPromises: Promise<void>[] = [];
      const assetMapping: { [key: string]: string } = {};

      // Find all video clips with blob URLs
      for (const track of remotionTimeline.timeline) {
        if (track.type === 'video') {
          for (const clip of track.clips) {
            const videoClip = clip as { id: string; assetUrl?: string };
            if (videoClip.assetUrl && videoClip.assetUrl.startsWith('blob:')) {
              const assetPromise = fetch(videoClip.assetUrl)
                .then(response => response.blob())
                .then(blob => {
                  const filename = `asset-${videoClip.id}.mp4`;
                  formData.append('assets', blob, filename);
                  assetMapping[videoClip.assetUrl] = filename;
                });
              assetPromises.push(assetPromise);
            }
          }
        }
      }

      // Wait for all assets to be processed
      await Promise.all(assetPromises);

      // Update timeline with asset mappings
      const updatedTimeline = JSON.parse(JSON.stringify(remotionTimeline));
      for (const track of updatedTimeline.timeline) {
        if (track.type === 'video') {
          for (const clip of track.clips) {
            const videoClip = clip as { id: string; assetUrl?: string };
            if (videoClip.assetUrl && assetMapping[videoClip.assetUrl]) {
              videoClip.assetUrl = `/temp-assets/${assetMapping[videoClip.assetUrl]}`;
            }
          }
        }
      }

      // Update the timeline in FormData
      formData.set('timeline', JSON.stringify(updatedTimeline));

      // Call the backend export API
      const response = await fetch('/api/export', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Export failed');
      }

      // Get the video file as a blob
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      link.download = `vibe-movie-export-${timestamp}.mp4`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      window.URL.revokeObjectURL(url);
      
      console.log('Export completed successfully');
      
    } catch (error) {
      console.error('Export failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Export failed: ${errorMessage}`);
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  }, [tracks, assets, isExporting]);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={handleExport}
        disabled={isExporting}
        className={`toolbar-btn ${isExporting ? 'exporting' : ''}`}
        title="Export video with all edits and effects"
        style={{
          backgroundColor: isExporting ? '#ff6b6b' : undefined,
          opacity: isExporting ? 0.8 : 1,
          cursor: isExporting ? 'not-allowed' : 'pointer',
        }}
      >
        {isExporting ? '⏳ Exporting...' : '🎬 Export Video'}
      </button>
      
      {isExporting && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: '0',
            right: '0',
            marginTop: '4px',
            padding: '8px',
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            color: 'white',
            borderRadius: '4px',
            fontSize: '12px',
            textAlign: 'center',
            zIndex: 1000,
            whiteSpace: 'nowrap',
          }}
        >
          <div style={{ marginBottom: '4px' }}>
            Processing video with Remotion...
          </div>
          <div
            style={{
              width: '100%',
              height: '4px',
              backgroundColor: '#333',
              borderRadius: '2px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${exportProgress}%`,
                height: '100%',
                backgroundColor: '#4ECDC4',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
