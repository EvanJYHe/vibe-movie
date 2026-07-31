const { createApp } = require("./src/app");
const { config } = require("./src/config");

const app = createApp();

app.listen(config.port, () => {
  console.log(`VibeMovie API listening on http://127.0.0.1:${config.port}`);
  if (!config.geminiApiKey) {
    console.warn("GEMINI_API_KEY is not configured; AI editing is disabled.");
  }
});
