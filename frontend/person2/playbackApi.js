const DEFAULT_BASE_URL = "http://localhost:5000/api/playback";

function buildUrl(path, baseUrl = DEFAULT_BASE_URL) {
  return `${baseUrl}${path}`;
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch (_err) {
    payload = null;
  }

  if (!response.ok) {
    const message = payload?.error || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return payload;
}

export const SENTIMENTS = [
  "study",
  "chill",
  "calm",
  "party",
  "intense",
  "romantic",
];

export async function getCurrentPlayback(baseUrl = DEFAULT_BASE_URL) {
  return requestJson(buildUrl("/current", baseUrl), { method: "GET" });
}

export async function overrideBySentiment(sentiment, baseUrl = DEFAULT_BASE_URL) {
  if (!SENTIMENTS.includes(sentiment)) {
    throw new Error(`Invalid sentiment: "${sentiment}"`);
  }

  return requestJson(buildUrl("/override", baseUrl), {
    method: "POST",
    body: JSON.stringify({ sentiment }),
  });
}

export async function overrideByTrack(track, baseUrl = DEFAULT_BASE_URL) {
  return requestJson(buildUrl("/override", baseUrl), {
    method: "POST",
    body: JSON.stringify({ track }),
  });
}

export function startPlaybackPolling({
  onUpdate,
  onError,
  intervalMs = 3000,
  baseUrl = DEFAULT_BASE_URL,
}) {
  let timerId = null;
  let stopped = false;

  const tick = async () => {
    if (stopped) return;
    try {
      const state = await getCurrentPlayback(baseUrl);
      onUpdate?.(state);
    } catch (error) {
      onError?.(error);
    } finally {
      if (!stopped) {
        timerId = setTimeout(tick, intervalMs);
      }
    }
  };

  tick();

  return () => {
    stopped = true;
    if (timerId) clearTimeout(timerId);
  };
}
