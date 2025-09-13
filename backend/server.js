const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const { generatePrompt, parseTimelineFromResponse, cleanResponseText } = require('./prompts/geminiPrompts');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    cb(null, file.mimetype.startsWith('video/'));
  }
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const generateId = () => `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

const cleanupFile = (filePath) => {
  setTimeout(() => {
    try {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch (e) {
      console.error('Cleanup error:', e.message);
    }
  }, 5000);
};

const fileToGenerativePart = (path, mimeType) => ({
  inlineData: {
    data: Buffer.from(fs.readFileSync(path)).toString('base64'),
    mimeType
  }
});

// parseTimelineFromResponse moved to prompts/geminiPrompts.js

app.post('/api/chat', upload.single('video'), async (req, res) => {
  let videoPath = null;

  try {
    const { messages, timeline } = req.body;
    console.log(timeline);
    const parsedMessages = JSON.parse(messages || '[]');
    const parsedTimeline = JSON.parse(timeline || '{}');

    if (!parsedMessages.length) {
      return res.status(400).json({ error: 'Messages required' });
    }

    const userMessage = parsedMessages[parsedMessages.length - 1].content;
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

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
      timestamp: new Date().toISOString()
    };

    if (modifiedTimeline) {
      response.timeline = modifiedTimeline;
    }

    res.json(response);

  } catch (error) {
    console.error('Chat error:', error.message);
    res.status(500).json({
      error: error.message.includes('API key') ? 'Invalid API key' : 'Server error'
    });
  } finally {
    if (videoPath) cleanupFile(videoPath);
  }
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    geminiConfigured: !!process.env.GEMINI_API_KEY
  });
});

app.use((error, req, res, next) => {
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File too large (100MB max)' });
  }
  res.status(500).json({ error: 'Server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 AI Video Editor Backend running on port ${PORT}`);
  if (!process.env.GEMINI_API_KEY) {
    console.warn('⚠️  Warning: GEMINI_API_KEY not configured');
  }
});
