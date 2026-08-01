const test = require("node:test");
const assert = require("node:assert/strict");
const { createApp } = require("../src/app");

async function startApp(context, options) {
  const server = createApp(options).listen(0, "127.0.0.1");
  context.after(() => server.close());
  await new Promise((resolve) => server.once("listening", resolve));
  return `http://127.0.0.1:${server.address().port}`;
}

test("reports API health without exposing AI credentials", async (context) => {
  const origin = await startApp(context);

  const response = await fetch(`${origin}/api/health`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.status, "ok");
  assert.equal(Object.hasOwn(body, "geminiConfigured"), false);
  assert.equal(Object.hasOwn(body, "geminiApiKey"), false);
});

test("requires a request-scoped Gemini API key before accepting chat input", async (context) => {
  let modelCreated = false;
  const origin = await startApp(context, {
    createModel() {
      modelCreated = true;
      throw new Error("The model should not be created without a key.");
    },
  });

  const response = await fetch(`${origin}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: [{ content: "Tighten the opening." }] }),
  });
  const body = await response.json();

  assert.equal(response.status, 401);
  assert.match(response.headers.get("www-authenticate"), /^Bearer /);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(body.error, "Add a valid Gemini API key to use AI editing.");
  assert.equal(modelCreated, false);
});

test("rejects malformed or oversized Gemini API keys", async (context) => {
  const origin = await startApp(context);

  for (const token of ["short", "invalid key with spaces", "a".repeat(257)]) {
    const response = await fetch(`${origin}/api/chat`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messages: [{ content: "Tighten the opening." }] }),
    });

    assert.equal(response.status, 401);
    assert.equal(response.headers.get("cache-control"), "no-store");
  }
});

test("uses the supplied Gemini API key only for the current request", async (context) => {
  const apiKey = "AIzaSyExampleRequestScopedKey123456789";
  const receivedKeys = [];
  const origin = await startApp(context, {
    createModel(receivedKey) {
      receivedKeys.push(receivedKey);
      return {
        async generateContent() {
          return {
            response: {
              text: () => "I tightened the opening.",
            },
          };
        },
      };
    },
  });

  const response = await fetch(`${origin}/api/chat`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages: [{ role: "user", content: "Tighten the opening." }],
      timeline: {},
      assets: [],
    }),
  });
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(body.content, "I tightened the opening.");
  assert.deepEqual(receivedKeys, [apiKey]);
  assert.equal(JSON.stringify(body).includes(apiKey), false);
});

test("sanitizes Gemini authentication errors", async (context) => {
  const apiKey = "AIzaSyExampleRejectedKey123456789012";
  const origin = await startApp(context, {
    createModel() {
      return {
        async generateContent() {
          const error = new Error(`Request rejected for ${apiKey}`);
          error.status = 403;
          throw error;
        },
      };
    },
  });

  const response = await fetch(`${origin}/api/chat`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messages: [{ content: "Tighten the opening." }] }),
  });
  const body = await response.json();

  assert.equal(response.status, 401);
  assert.equal(body.error, "Gemini rejected this API key.");
  assert.equal(JSON.stringify(body).includes(apiKey), false);
});

test("does not expose a key from an unexpected Gemini failure", async (context) => {
  const apiKey = "AIzaSyExampleUnexpectedKey12345678901";
  const loggedErrors = [];
  const originalConsoleError = console.error;
  console.error = (...values) => loggedErrors.push(values.map(String).join(" "));
  context.after(() => {
    console.error = originalConsoleError;
  });

  const origin = await startApp(context, {
    createModel() {
      throw new Error(`Could not initialize with ${apiKey}`);
    },
  });

  const response = await fetch(`${origin}/api/chat`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messages: [{ content: "Tighten the opening." }] }),
  });
  const body = await response.json();

  assert.equal(response.status, 502);
  assert.equal(body.error, "The server could not complete the request.");
  assert.equal(JSON.stringify(body).includes(apiKey), false);
  assert.equal(loggedErrors.join("\n").includes(apiKey), false);
});
