const crypto = require("crypto");
const fs = require("fs");
const os = require("os");
const path = require("path");
const cors = require("cors");
const express = require("express");
const multer = require("multer");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { config } = require("./config");
const { normalizeTimeline, validateTimeline } = require("./timeline");
const { renderTimeline } = require("./services/render");
const {
  cleanResponseText,
  generatePrompt,
  parseTimelineFromResponse,
} = require("../prompts/geminiPrompts");

const chatUploadDirectory = path.join(os.tmpdir(), "vibemovie-chat");
const exportUploadDirectory = path.join(os.tmpdir(), "vibemovie-assets");
const geminiApiKeyPattern = /^[A-Za-z0-9_-]{20,256}$/;
fs.mkdirSync(chatUploadDirectory, { recursive: true });
fs.mkdirSync(exportUploadDirectory, { recursive: true });

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function parseJsonField(value, fallback, label) {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    throw httpError(400, `${label} must contain valid JSON.`);
  }
}

function acceptsMedia(file) {
  return /^(video|audio|image)\//.test(file.mimetype);
}

function uploadFilter(predicate) {
  return (_request, file, callback) => {
    if (predicate(file)) return callback(null, true);
    const error = httpError(415, `Unsupported media type: ${file.mimetype || "unknown"}.`);
    return callback(error);
  };
}

async function removePaths(paths) {
  await Promise.allSettled(
    paths.filter(Boolean).map((target) => fs.promises.rm(target, { force: true, recursive: true }))
  );
}

function publicAssetUrl(filename) {
  return `${config.renderAssetOrigin}/temp-assets/${encodeURIComponent(filename)}`;
}

function createGeminiModel(apiKey) {
  return new GoogleGenerativeAI(apiKey).getGenerativeModel({
    model: "gemini-2.5-flash",
  });
}

function requireGeminiApiKey(request, response, next) {
  response.setHeader("Cache-Control", "no-store");

  const authorization = request.get("authorization");
  const match = typeof authorization === "string"
    ? authorization.match(/^Bearer ([A-Za-z0-9_-]+)$/i)
    : null;

  if (!match || !geminiApiKeyPattern.test(match[1])) {
    response.setHeader("WWW-Authenticate", 'Bearer realm="VibeMovie AI"');
    next(httpError(401, "Add a valid Gemini API key to use AI editing."));
    return;
  }

  response.locals.geminiApiKey = match[1];
  next();
}

function replaceTemporaryAssetUrls(timeline, uploadedFiles) {
  const filesByOriginalName = new Map(
    uploadedFiles.map((file) => [path.basename(file.originalname), file])
  );

  return {
    ...timeline,
    timeline: timeline.timeline.map((track) => ({
      ...track,
      clips: track.clips.map((clip) => {
        if (typeof clip.assetUrl !== "string" || !clip.assetUrl.startsWith("/temp-assets/")) {
          return clip;
        }
        const originalName = path.basename(clip.assetUrl);
        const upload = filesByOriginalName.get(originalName);
        return upload ? { ...clip, assetUrl: publicAssetUrl(upload.filename) } : clip;
      }),
    })),
  };
}

function createApp({
  render = renderTimeline,
  createModel = createGeminiModel,
} = {}) {
  const app = express();
  let activeRenders = 0;

  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || config.allowedOrigins.includes("*") || config.allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(httpError(403, "Origin is not allowed."));
      },
    })
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(
    "/temp-assets",
    express.static(exportUploadDirectory, {
      fallthrough: false,
      setHeaders(response) {
        response.setHeader("Cache-Control", "private, no-store");
      },
    })
  );

  const chatUpload = multer({
    dest: chatUploadDirectory,
    fileFilter: uploadFilter((file) => file.mimetype.startsWith("video/")),
    limits: { fileSize: config.maxChatFileSizeBytes, files: 1 },
  });
  const exportUpload = multer({
    dest: exportUploadDirectory,
    fileFilter: uploadFilter(acceptsMedia),
    limits: {
      fileSize: config.maxExportFileSizeBytes,
      files: config.maxExportAssets,
      fields: 2,
      parts: config.maxExportAssets + 2,
    },
  });

  app.get("/api/health", (_request, response) => {
    response.json({
      status: "ok",
      timestamp: new Date().toISOString(),
    });
  });

  app.post(
    "/api/chat",
    requireGeminiApiKey,
    chatUpload.single("video"),
    async (request, response, next) => {
      try {
        const messages = parseJsonField(request.body.messages, [], "messages");
        const timeline = parseJsonField(request.body.timeline, {}, "timeline");
        const assets = parseJsonField(request.body.assets, [], "assets");
        if (!Array.isArray(messages) || messages.length === 0) {
          throw httpError(400, "At least one chat message is required.");
        }

        const userMessage = messages.at(-1)?.content;
        if (typeof userMessage !== "string" || !userMessage.trim()) {
          throw httpError(400, "The latest chat message must contain text.");
        }

        const prompt = generatePrompt(userMessage, timeline, Boolean(request.file), assets);
        const inputs = [prompt];
        if (request.file) {
          const data = await fs.promises.readFile(request.file.path);
          inputs.push({
            inlineData: { data: data.toString("base64"), mimeType: request.file.mimetype },
          });
        }

        let responseText;
        try {
          const model = createModel(response.locals.geminiApiKey);
          const result = await model.generateContent(inputs);
          responseText = result.response.text();
        } catch (error) {
          if ([400, 401, 403].includes(error?.status)) {
            throw httpError(401, "Gemini rejected this API key.");
          }
          throw httpError(502, "Gemini could not complete the request.");
        }
        const editedTimeline = parseTimelineFromResponse(responseText);

        response.json({
          id: `msg_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`,
          content: cleanResponseText(responseText) || "The timeline has been updated.",
          timestamp: new Date().toISOString(),
          ...(editedTimeline ? { timeline: editedTimeline } : {}),
        });
      } catch (error) {
        next(error);
      } finally {
        delete response.locals.geminiApiKey;
        if (request.file?.path) await removePaths([request.file.path]);
      }
    }
  );

  app.post(
    "/api/export",
    exportUpload.array("assets", config.maxExportAssets),
    async (request, response, next) => {
      const uploadedFiles = Array.isArray(request.files) ? request.files : [];
      let renderDirectory;
      let renderReserved = false;

      try {
        if (activeRenders >= config.maxConcurrentRenders) {
          throw httpError(429, "The renderer is busy. Try the export again shortly.");
        }

        const requestedTimeline = parseJsonField(request.body.timeline, null, "timeline");
        if (!requestedTimeline) throw httpError(400, "Timeline data is required.");

        const timeline = replaceTemporaryAssetUrls(
          normalizeTimeline(requestedTimeline),
          uploadedFiles
        );
        const validation = validateTimeline(timeline);
        if (!validation.valid) {
          throw httpError(400, `Invalid timeline: ${validation.errors.join(" ")}`);
        }
        if (!timeline.timeline.some((track) => track.clips.length > 0)) {
          throw httpError(400, "Add at least one clip before exporting.");
        }

        activeRenders += 1;
        renderReserved = true;
        renderDirectory = await fs.promises.mkdtemp(
          path.join(os.tmpdir(), "vibemovie-render-")
        );
        const outputPath = path.join(renderDirectory, "vibemovie.mp4");

        await render({
          timeline,
          outputPath,
          onProgress: ({ progress }) => {
            const percent = Math.round(progress * 100);
            if (percent % 25 === 0) console.log(`Export render ${percent}%`);
          },
        });

        const downloadName = `vibemovie-${new Date().toISOString().replace(/[:.]/g, "-")}.mp4`;
        response.download(outputPath, downloadName, async (error) => {
          await removePaths([
            renderDirectory,
            ...uploadedFiles.map((file) => file.path),
          ]);
          activeRenders -= 1;
          if (error && !response.headersSent) next(error);
        });
      } catch (error) {
        await removePaths([
          renderDirectory,
          ...uploadedFiles.map((file) => file.path),
        ]);
        if (renderReserved) activeRenders -= 1;
        next(error);
      }
    }
  );

  app.use((error, _request, response, _next) => {
    const status = error.status || (error instanceof multer.MulterError ? 400 : 500);
    const message =
      error instanceof multer.MulterError
        ? error.code === "LIMIT_FILE_SIZE"
          ? "The uploaded file exceeds the configured size limit."
          : `Upload failed: ${error.message}`
        : status >= 500
          ? "The server could not complete the request."
          : error.message;

    if (status >= 500) console.error(error);
    response.status(status).json({ error: message });
  });

  return app;
}

module.exports = { createApp };
