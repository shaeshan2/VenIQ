function createEl(tag, className, text = "") {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text) el.textContent = text;
  return el;
}

function sourceLabel(source) {
  if (source === "auto") return "Auto";
  if (source === "override") return "Override";
  return "Unknown";
}

export function createMusicPlayer(rootElement) {
  const container = createEl("section", "dj-card");
  const title = createEl("h2", "dj-title", "Now Playing");
  const trackName = createEl("div", "track-name", "No track loaded");
  const artist = createEl("div", "track-artist", "-");
  const source = createEl("div", "track-source", "Source: -");
  const crowdSentiment = createEl("div", "track-crowd-sentiment", "Crowd sentiment: -");
  const crowdEnergy = createEl("div", "track-crowd-energy", "Crowd energy: -");
  const lastUpdated = createEl("div", "track-last-updated", "Last updated: never");
  const status = createEl("div", "track-status", "Waiting for playback state...");
  const previewLink = createEl("a", "track-link", "");
  previewLink.target = "_blank";
  previewLink.rel = "noopener noreferrer";

  const audio = document.createElement("audio");
  audio.controls = true;
  audio.preload = "none";
  audio.className = "preview-audio";

  container.append(
    title,
    trackName,
    artist,
    source,
    crowdSentiment,
    crowdEnergy,
    lastUpdated,
    status,
    audio,
    previewLink
  );
  rootElement.appendChild(container);

  let lastPreviewUrl = null;
  let lastUpdatedAt = null;
  const tickHandle = setInterval(() => {
    if (!lastUpdatedAt) {
      lastUpdated.textContent = "Last updated: never";
      return;
    }
    const ageSeconds = Math.max(0, Math.floor((Date.now() - lastUpdatedAt) / 1000));
    lastUpdated.textContent = `Last updated: ${ageSeconds}s ago`;
  }, 1000);

  function setStatus(message) {
    status.textContent = message;
  }

  function update(state) {
    lastUpdatedAt = Date.now();
    const track = state?.track || null;
    const stateSource = state?.source || null;

    if (!track) {
      trackName.textContent = "No track loaded";
      artist.textContent = "-";
      source.textContent = "Source: -";
      setStatus("No active track in backend state.");
      audio.removeAttribute("src");
      audio.load();
      previewLink.textContent = "";
      previewLink.removeAttribute("href");
      lastPreviewUrl = null;
      return;
    }

    trackName.textContent = track.name || "Unknown track";
    artist.textContent = track.artist || "Unknown artist";
    source.textContent = `Source: ${sourceLabel(stateSource)}`;

    if (track.preview_url) {
      previewLink.textContent = "Open Spotify preview";
      previewLink.href = track.spotify_url || track.preview_url;
      setStatus("Playing 30s preview clip.");

      if (lastPreviewUrl !== track.preview_url) {
        audio.src = track.preview_url;
        audio.play().catch(() => {
          setStatus("Preview ready (click play if autoplay is blocked).");
        });
        lastPreviewUrl = track.preview_url;
      }
    } else {
      setStatus("No preview clip available for this track.");
      audio.removeAttribute("src");
      audio.load();
      previewLink.textContent = track.spotify_url ? "Open on Spotify" : "";
      if (track.spotify_url) previewLink.href = track.spotify_url;
      lastPreviewUrl = null;
    }
  }

  function setCrowdContext({ sentiment = null, energy = null } = {}) {
    crowdSentiment.textContent = `Crowd sentiment: ${sentiment || "-"}`;
    crowdEnergy.textContent = `Crowd energy: ${energy ?? "-"}`;
  }

  function destroy() {
    clearInterval(tickHandle);
  }

  return { update, setStatus, setCrowdContext, audio, destroy };
}
