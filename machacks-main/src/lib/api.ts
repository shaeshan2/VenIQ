const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5000";

export interface Track {
  name: string;
  artist: string;
  bpm: number;
  key: string;
  genre: string;
  duration_s: number;
  youtube_id: string | null;
  youtube_url: string | null;
  // Deezer fields
  preview_url?: string | null;
  cover_url?: string | null;
  deezer_url?: string | null;
  deezer_id?: string | number | null;
}

export interface AnalysisEntry {
  timestamp: string;
  changed: boolean;
  energy: number;
  sentiment: string;
  confidence: number;
  description: string;
  coach_message: string | null;
  detected_mode: "study" | "club" | null;
  track: Track | null;
  error?: string;
}


export interface MediaPipeContext {
  face_detected?: boolean;
  eye_openness?: number;
  smile_score?: number;
  brow_furrow?: number;
  suggested_emotion?: string | null;
  person_count?: number;
  hands_raised?: number;
  suggested_mode?: string | null;
}

export async function analyzeFrame(
  imageBase64: string,
  mode: "auto" | "club" | "study" = "auto",
  mediapipe?: MediaPipeContext,
  preferences?: string[],
): Promise<AnalysisEntry> {
  const res = await fetch(`${BASE_URL}/api/crowd/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image_base64: imageBase64, mode, mediapipe, preferences }),
  });
  if (!res.ok) throw new Error(`analyze failed: ${res.status}`);
  return res.json();
}

export async function getHistory(): Promise<AnalysisEntry[]> {
  const res = await fetch(`${BASE_URL}/api/crowd/history`);
  if (!res.ok) throw new Error(`history failed: ${res.status}`);
  const data = await res.json();
  return data.history as AnalysisEntry[];
}

export async function clearHistory(): Promise<void> {
  await fetch(`${BASE_URL}/api/crowd/history`, { method: "DELETE" });
}

export async function overrideSentiment(sentiment: string, excludeId?: string | number, preferences?: string[]): Promise<Track | null> {
  const res = await fetch(`${BASE_URL}/api/playback/override`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sentiment, exclude_id: excludeId ?? null, preferences }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.track ?? null;
}
