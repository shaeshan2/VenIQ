import {
  getCurrentPlayback,
  overrideBySentiment,
  startPlaybackPolling,
} from "./playbackApi.js";
import { createMusicPlayer } from "./musicPlayer.js";
import { createDjControls } from "./djControls.js";

export async function initPerson2UI(
  container,
  {
    playbackBaseUrl = "http://localhost:5000/api/playback",
    pollIntervalMs = 3000,
  } = {}
) {
  if (!container) {
    throw new Error("initPerson2UI requires a container element");
  }

  const player = createMusicPlayer(container);
  const controls = createDjControls(container, {
    onSentimentClick: async (sentiment) => {
      const state = await overrideBySentiment(sentiment, playbackBaseUrl);
      player.update(state);
      return state;
    },
  });

  try {
    const initial = await getCurrentPlayback(playbackBaseUrl);
    player.update(initial);
  } catch (error) {
    player.setStatus(`Failed initial sync: ${error.message}`);
  }

  const stopPolling = startPlaybackPolling({
    baseUrl: playbackBaseUrl,
    intervalMs: pollIntervalMs,
    onUpdate: (state) => player.update(state),
    onError: (error) => {
      player.setStatus(`Polling error: ${error.message}`);
      controls.setFeedback(`Sync issue: ${error.message}`);
    },
  });

  return {
    syncFromAnalyzeResponse(analyzeResponse) {
      if (!analyzeResponse || typeof analyzeResponse !== "object") return;

      player.setCrowdContext({
        sentiment: analyzeResponse.sentiment || null,
        energy: Number.isFinite(analyzeResponse.energy) ? analyzeResponse.energy : null,
      });

      if (analyzeResponse.changed && analyzeResponse.track) {
        player.update({ source: "auto", track: analyzeResponse.track });
      }
    },
    stop() {
      stopPolling();
      player.destroy();
    },
    player,
    controls,
  };
}
