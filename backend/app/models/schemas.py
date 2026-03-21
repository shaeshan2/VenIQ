from dataclasses import dataclass, field
from typing import Optional


@dataclass
class AnalyzeResponse:
    mood: str           # "happy" | "sad" | "anxious" | "calm"
    age_bracket: str    # "young" | "middle" | "senior"
    confidence: float
    fallback_reason: Optional[str] = None


@dataclass
class IngestResponse:
    track_id: str
    title: str
    duration_s: int


@dataclass
class PlaylistItem:
    session_id: str
    audio_url: str
    title: str


@dataclass
class TransformResponse:
    playlist: list[PlaylistItem] = field(default_factory=list)
