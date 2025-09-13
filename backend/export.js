const { bundle } = require('@remotion/bundler');
const { renderMedia, getCompositions } = require('@remotion/renderer');
const path = require('path');
const fs = require('fs');

const COMPOSITION_ID = 'VideoComposition';
const ENTRY_POINT = path.join(__dirname, '../frontend/src/remotion/remotion.entry.tsx');
const OUTPUT_DIR = 'public';

const exportVideo = async (timeline) => {
  try {
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR);
    }

    const bundleLocation = await bundle({
        entryPoint: ENTRY_POINT,
        webpackOverride: (config) => config,
    });

    const comps = await getCompositions(bundleLocation, {
      inputProps: { timeline },
    });
    
    const composition = comps.find((c) => c.id === COMPOSITION_ID);
    if (!composition) {
      throw new Error(`Composition "${COMPOSITION_ID}" not found.`);
    }

    const outputLocation = path.join(OUTPUT_DIR, `output-${Date.now()}.mp4`);

    await renderMedia({
      composition,
      serveUrl: bundleLocation,
      outputLocation,
      inputProps: { timeline },
    });

    return outputLocation;
  } catch (error) {
    console.error('Error exporting video:', error);
    throw new Error('Failed to export video.');
  }
};

module.exports = { exportVideo };
