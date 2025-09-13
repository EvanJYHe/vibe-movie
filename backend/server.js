const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const path = require("path");
const { bundle } = require("@remotion/bundler");
const { renderMedia, selectComposition } = require("@remotion/renderer");
const { VideoComposition } = require("./remotion/VideoComposition");
const {
  generatePrompt,
  parseTimelineFromResponse,
  cleanResponseText,
} = require("./prompts/geminiPrompts");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Serve temporary assets for export
app.use('/temp-assets', express.static(path.join(__dirname, 'temp-assets')));

const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    cb(null, file.mimetype.startsWith("video/"));
  },
});

const assetUpload = multer({
  dest: "temp-assets/",
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB for video assets
  fileFilter: (req, file, cb) => {
    // Accept video, audio, and image files
    cb(null, file.mimetype.startsWith("video/") || 
             file.mimetype.startsWith("audio/") || 
             file.mimetype.startsWith("image/"));
  },
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const generateId = () =>
  `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

const cleanupFile = (filePath) => {
  setTimeout(() => {
    try {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch (e) {
      console.error("Cleanup error:", e.message);
    }
  }, 5000);
};

const fileToGenerativePart = (path, mimeType) => ({
  inlineData: {
    data: Buffer.from(fs.readFileSync(path)).toString("base64"),
    mimeType,
  },
});

// parseTimelineFromResponse moved to prompts/geminiPrompts.js

// Export video endpoint
app.post("/api/export", assetUpload.array('assets'), async (req, res) => {
  const uploadedAssets = req.files || [];
  
  try {
    const timeline = typeof req.body.timeline === 'string' 
      ? JSON.parse(req.body.timeline) 
      : req.body.timeline;
    
    if (!timeline || !timeline.timeline || timeline.timeline.length === 0) {
      return res.status(400).json({ error: "Timeline data required" });
    }

    console.log("Starting video export for timeline:", JSON.stringify(timeline, null, 2));
    console.log("Uploaded assets:", uploadedAssets.map(f => f.filename));

    // Update timeline to use URLs accessible from the bundled server
    const updatedTimeline = JSON.parse(JSON.stringify(timeline));
    for (const track of updatedTimeline.timeline) {
      if (track.type === 'video') {
        for (const clip of track.clips) {
          if (clip.assetUrl && clip.assetUrl.startsWith('/temp-assets/')) {
            const filename = clip.assetUrl.replace('/temp-assets/', '');
            const uploadedFile = uploadedAssets.find(f => f.originalname === filename);
            if (uploadedFile) {
              // Use localhost URL that the bundled server can access
              clip.assetUrl = `http://localhost:3001/temp-assets/${uploadedFile.filename}`;
              console.log(`Updated asset URL: ${clip.assetUrl}`);
            }
          }
        }
      }
    }

    // Create temporary entry file for Remotion
    const entryFile = path.join(__dirname, "temp-entry.js");
    const entryContent = `
const React = require('react');
const { Composition, registerRoot } = require('remotion');
const { VideoComposition } = require('./remotion/VideoComposition');

const timeline = ${JSON.stringify(updatedTimeline)};

// Calculate total duration
const calculateTotalDuration = (timeline) => {
  let maxEndFrame = 0;
  timeline.timeline.forEach((track) => {
    track.clips.forEach((clip) => {
      const clipEndFrame = clip.startInFrames + clip.durationInFrames;
      if (clipEndFrame > maxEndFrame) {
        maxEndFrame = clipEndFrame;
      }
    });
  });
  return maxEndFrame || 300; // Default to 10 seconds if empty
};

const durationInFrames = calculateTotalDuration(timeline);

const RemotionRoot = () => {
  return React.createElement(React.Fragment, null,
    React.createElement(Composition, {
      id: "VideoExport",
      component: VideoComposition,
      durationInFrames: durationInFrames,
      fps: ${timeline.project.fps || 30},
      width: ${timeline.project.width || 1920},
      height: ${timeline.project.height || 1080},
      defaultProps: { timeline }
    })
  );
};

registerRoot(RemotionRoot);
`;

    fs.writeFileSync(entryFile, entryContent);

    // Bundle the Remotion project
    console.log("Bundling Remotion project...");
    const bundleLocation = await bundle({
      entryPoint: entryFile,
      webpackOverride: (config) => config,
    });

    // Get composition
    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: "VideoExport",
      inputProps: { timeline: updatedTimeline },
    });

    console.log("Selected composition:", composition);

    // Generate unique filename
    const timestamp = Date.now();
    const outputPath = path.join(__dirname, "exports", `video-export-${timestamp}.mp4`);
    
    // Ensure exports directory exists
    const exportsDir = path.join(__dirname, "exports");
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }

    console.log("Starting video render...");
    
    // Render the video
    await renderMedia({
      composition,
      serveUrl: bundleLocation,
      codec: "h264",
      outputLocation: outputPath,
      inputProps: { timeline: updatedTimeline },
      onProgress: ({ progress }) => {
        console.log(`Render progress: ${Math.round(progress * 100)}%`);
      },
    });

    console.log("Video render completed:", outputPath);

    // Clean up temp files
    try {
      fs.unlinkSync(entryFile);
    } catch (e) {
      console.warn("Failed to clean up temp entry file:", e.message);
    }

    // Send the file
    const filename = `vibe-movie-export-${timestamp}.mp4`;
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Type", "video/mp4");
    
    const fileStream = fs.createReadStream(outputPath);
    fileStream.pipe(res);

    // Clean up exported file and uploaded assets after sending
    fileStream.on('end', () => {
      setTimeout(() => {
        try {
          fs.unlinkSync(outputPath);
        } catch (e) {
          console.warn("Failed to clean up exported file:", e.message);
        }
        
        // Clean up uploaded assets
        uploadedAssets.forEach(file => {
          try {
            fs.unlinkSync(file.path);
          } catch (e) {
            console.warn(`Failed to clean up asset ${file.filename}:`, e.message);
          }
        });
      }, 5000);
    });

  } catch (error) {
    console.error("Export error:", error);
    
    // Clean up uploaded assets on error
    uploadedAssets.forEach(file => {
      try {
        fs.unlinkSync(file.path);
      } catch (e) {
        console.warn(`Failed to clean up asset ${file.filename}:`, e.message);
      }
    });
    
    res.status(500).json({ 
      error: "Export failed", 
      details: error.message 
    });
  }
});

app.post("/api/chat", upload.single("video"), async (req, res) => {
  let videoPath = null;

  try {
    const { messages, timeline } = req.body;
    console.log(timeline);
    const parsedMessages = JSON.parse(messages || "[]");
    const parsedTimeline = JSON.parse(timeline || "{}");

    if (!parsedMessages.length) {
      return res.status(400).json({ error: "Messages required" });
    }

    const userMessage = parsedMessages[parsedMessages.length - 1].content;
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Generate enhanced prompt with Remotion knowledge
    const hasVideo = !!req.file;
    const prompt = generatePrompt(userMessage, parsedTimeline, hasVideo);

    let inputs = [prompt];

    if (req.file) {
      videoPath = req.file.path;
      const videoPart = fileToGenerativePart(videoPath, req.file.mimetype);
      inputs = [prompt, videoPart];
    }

    const result = await model.generateContent(inputs);
    const responseText = result.response.text();
    const modifiedTimeline = parseTimelineFromResponse(responseText);

    const response = {
      id: generateId(),
      content: cleanResponseText(responseText),
      timestamp: new Date().toISOString(),
    };

    if (modifiedTimeline) {
      response.timeline = modifiedTimeline;
    }

    res.json(response);
  } catch (error) {
    console.error("Chat error:", error.message);
    res.status(500).json({
      error: error.message.includes("API key")
        ? "Invalid API key"
        : "Server error",
    });
  } finally {
    if (videoPath) cleanupFile(videoPath);
  }
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    geminiConfigured: !!process.env.GEMINI_API_KEY,
  });
});

app.use((error, req, res, next) => {
  if (error.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ error: "File too large (100MB max)" });
  }
  res.status(500).json({ error: "Server error" });
});

app.listen(PORT, () => {
  console.log(`🚀 AI Video Editor Backend running on port ${PORT}`);
  if (!process.env.GEMINI_API_KEY) {
    console.warn("⚠️  Warning: GEMINI_API_KEY not configured");
  }
});
