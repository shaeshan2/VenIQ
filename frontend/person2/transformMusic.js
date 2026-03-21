import { overrideBySentiment } from "./playbackApi.js";

/**
 * Hackathon-friendly adapter for the requested deliverable signature.
 * This project does not transform waveform data. Instead, it selects
 * a new Spotify track that matches the mood and returns it as modified_audio.
 */
export async function transformMusic(audio, mood, baseUrl = "http://localhost:5001/api/playback") {
  const response = await overrideBySentiment(mood, baseUrl);

  return {
    ...audio,
    mood,
    source: "override",
    modified_audio: response?.track?.preview_url || response?.track?.spotify_url || null,
    track: response?.track || null,
  };
}
