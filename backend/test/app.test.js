const test = require("node:test");
const assert = require("node:assert/strict");
const { createApp } = require("../src/app");

test("reports API health without exposing configuration", async (context) => {
  const server = createApp().listen(0, "127.0.0.1");
  context.after(() => server.close());
  await new Promise((resolve) => server.once("listening", resolve));

  const address = server.address();
  const response = await fetch(`http://127.0.0.1:${address.port}/api/health`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.status, "ok");
  assert.equal(typeof body.geminiConfigured, "boolean");
  assert.equal(Object.hasOwn(body, "geminiApiKey"), false);
});
