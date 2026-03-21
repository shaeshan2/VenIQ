import { initPerson2UI } from "./initPerson2UI.js";

function getApiBaseUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("playbackBaseUrl") || "http://localhost:5000/api/playback";
}

async function main() {
  const root = document.getElementById("app");
  if (!root) throw new Error("Missing #app root element");

  const baseUrl = getApiBaseUrl();
  await initPerson2UI(root, { playbackBaseUrl: baseUrl, pollIntervalMs: 3000 });
}

main().catch((error) => {
  const root = document.getElementById("app");
  if (root) {
    root.textContent = `Failed to initialize app: ${error.message}`;
  }
});
