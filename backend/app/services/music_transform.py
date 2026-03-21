"""
Music Transformation Service

Applies mood + age-aware transformations to a WAV file across four dimensions:
  1. BPM (time stretch)
  2. Key  (pitch shift in semitones)
  3. Instrumentation (EQ approximation: low-pass warmth for senior/sad)
  4. Flow  (attack/decay shaping via amplitude envelope)

Mood × Age matrix (tempo_factor, pitch_steps):
  sad     × young:  0.80, -1
  sad     × middle: 0.80, -1
  sad     × senior: 0.70, -2   ← extra slowdown + lower key for seniors
  anxious × young:  0.85,  0
  anxious × middle: 0.85,  0
  anxious × senior: 0.78,  0
  happy   × young:  1.15, +1
  happy   × middle: 1.10, +1
  happy   × senior: 1.00, +0   ← seniors: don't speed up, just brighten
  calm    × *:      1.00,  0

Output: MP3 written to output_path
"""

import os
import tempfile
import numpy as np
import librosa
import soundfile as sf
from pydub import AudioSegment
from scipy.signal import lfilter

# (tempo_factor, pitch_steps, low_pass_hz or None)
_MATRIX: dict[tuple[str, str], tuple[float, int, int | None]] = {
    ("sad",     "young"):  (0.80, -1, None),
    ("sad",     "middle"): (0.80, -1, 3500),
    ("sad",     "senior"): (0.70, -2, 3000),
    ("anxious", "young"):  (0.85,  0, None),
    ("anxious", "middle"): (0.85,  0, None),
    ("anxious", "senior"): (0.78,  0, 4000),
    ("happy",   "young"):  (1.15, +1, None),
    ("happy",   "middle"): (1.10, +1, None),
    ("happy",   "senior"): (1.00,  0, None),
    ("calm",    "young"):  (1.00,  0, None),
    ("calm",    "middle"): (1.00,  0, None),
    ("calm",    "senior"): (0.95,  0, 4500),
}

DEFAULT_PARAMS = (1.00, 0, None)


def transform_music(
    input_wav: str,
    mood: str,
    age_bracket: str,
    output_path: str,
) -> None:
    """
    Load input_wav, apply mood+age transformations, write MP3 to output_path.

    Args:
        input_wav:   path to source WAV file (from ingest service)
        mood:        "happy" | "sad" | "anxious" | "calm"
        age_bracket: "young" | "middle" | "senior"
        output_path: destination .mp3 path

    Raises:
        FileNotFoundError: if input_wav does not exist
    """
    if not os.path.exists(input_wav):
        raise FileNotFoundError(f"Input WAV not found: {input_wav}")

    tempo_factor, pitch_steps, low_pass_hz = _MATRIX.get(
        (mood, age_bracket), DEFAULT_PARAMS
    )

    y, sr = librosa.load(input_wav, sr=None, mono=True)

    # 1. BPM — time stretch
    if tempo_factor != 1.0:
        y = librosa.effects.time_stretch(y, rate=tempo_factor)

    # 2. Key — pitch shift
    if pitch_steps != 0:
        y = librosa.effects.pitch_shift(y, sr=sr, n_steps=pitch_steps)

    # 3. Instrumentation proxy — low-pass filter adds warmth (senior/sad)
    if low_pass_hz:
        y = _low_pass(y, sr, low_pass_hz)

    # 4. Flow — gentle fade-in / fade-out envelope
    y = _apply_flow_envelope(y, sr, mood)

    # Normalize to -1dBFS
    peak = np.max(np.abs(y))
    if peak > 0:
        y = y / peak * 0.9

    wav_to_mp3(y, sr, output_path)


def wav_to_mp3(y: np.ndarray, sr: int, output_path: str, bitrate: str = "192k") -> None:
    """Write a numpy audio array to an MP3 file via a temporary WAV."""
    tmp = tempfile.mktemp(suffix=".wav")
    try:
        sf.write(tmp, y, sr)
        AudioSegment.from_wav(tmp).export(output_path, format="mp3", bitrate=bitrate)
    finally:
        if os.path.exists(tmp):
            os.remove(tmp)


def _low_pass(y: np.ndarray, sr: int, cutoff_hz: int) -> np.ndarray:
    """Single-pole IIR low-pass — adds perceived warmth."""
    rc = 1.0 / (2 * np.pi * cutoff_hz)
    alpha = (1.0 / sr) / (rc + 1.0 / sr)
    # Vectorized via scipy lfilter: y[n] = alpha*x[n] + (1-alpha)*y[n-1]
    return lfilter([alpha], [1.0, -(1.0 - alpha)], y).astype(y.dtype)


def _apply_flow_envelope(y: np.ndarray, sr: int, mood: str) -> np.ndarray:
    """
    Shape amplitude envelope to reinforce 'flow':
      sad/anxious → longer fade-in (softer attack)
      happy       → short fade-in, short fade-out
      calm        → minimal shaping
    """
    n = len(y)
    envelope = np.ones(n)

    fade_in_s = {"sad": 3.0, "anxious": 2.0, "happy": 0.5, "calm": 1.0}.get(mood, 1.0)
    fade_out_s = {"sad": 4.0, "anxious": 3.0, "happy": 1.0, "calm": 2.0}.get(mood, 2.0)

    fade_in_samples = min(int(fade_in_s * sr), n // 4)
    fade_out_samples = min(int(fade_out_s * sr), n // 4)

    envelope[:fade_in_samples] = np.linspace(0, 1, fade_in_samples)
    envelope[n - fade_out_samples:] = np.linspace(1, 0, fade_out_samples)

    return y * envelope
