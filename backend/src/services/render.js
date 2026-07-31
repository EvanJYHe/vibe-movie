const path = require("path");
const { bundle } = require("@remotion/bundler");
const { renderMedia, selectComposition } = require("@remotion/renderer");

let bundlePromise;

function getBundleLocation() {
  if (!bundlePromise) {
    bundlePromise = bundle({
      entryPoint: path.join(__dirname, "..", "..", "remotion", "index.js"),
      webpackOverride: (configuration) => configuration,
    }).catch((error) => {
      bundlePromise = undefined;
      throw error;
    });
  }
  return bundlePromise;
}

async function renderTimeline({ timeline, outputPath, onProgress }) {
  const serveUrl = await getBundleLocation();
  const inputProps = { timeline };
  const composition = await selectComposition({
    serveUrl,
    id: "VideoExport",
    inputProps,
  });

  await renderMedia({
    codec: "h264",
    composition,
    inputProps,
    outputLocation: outputPath,
    serveUrl,
    onProgress,
  });
}

module.exports = { renderTimeline };
