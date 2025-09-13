const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
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
    data: Buffer.from(fs.readFileSync(path)).toString("base64"),
    mimeType
  }
});

const parseTimelineFromResponse = (text) => {
  try {
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/"timeline":\s*({[\s\S]*?})/);
    return jsonMatch ? JSON.parse(jsonMatch[1]) : null;
  } catch (e) {
    return null;
  }
};

app.post('/api/chat', upload.single('video'), async (req, res) => {
  let videoPath = null;

  try {
    const { messages, timeline } = req.body;
    const parsedMessages = JSON.parse(messages || '[]');
    const parsedTimeline = JSON.parse(timeline || '{}');

    if (!parsedMessages.length) {
      return res.status(400).json({ error: 'Messages required' });
    }

    const userMessage = parsedMessages[parsedMessages.length - 1].content;
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    let prompt = `You are an AI video editor assistant. User request: "${userMessage}"

Current timeline: ${JSON.stringify(parsedTimeline)}

For timeline modifications, provide:
1. Brief explanation of changes
2. JSON code block with updated timeline like:

\`\`\`json
{"project":{"width":1920,"height":1080,"fps":30},"timeline":[{"id":"track-1","type":"video","clips":[]},{"id":"track-2","type":"text","clips":[{"id":"text-1","text":"Welcome","startInFrames":0,"durationInFrames":90,"style":{"color":"white","fontSize":48}}]}]}
\`\`\`

Be concise and always include JSON if modifying timeline.`;

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
      content: responseText.replace(/```json[\s\S]*?```/g, '').trim(),
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