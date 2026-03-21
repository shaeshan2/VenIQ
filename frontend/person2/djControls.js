import { SENTIMENTS } from "./playbackApi.js";

function createEl(tag, className, text = "") {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text) el.textContent = text;
  return el;
}

export function createDjControls(rootElement, { onSentimentClick, onOverrideStateChange }) {
  const container = createEl("section", "dj-card");
  const title = createEl("h2", "dj-title", "DJ Override");
  const subtitle = createEl(
    "p",
    "dj-subtitle",
    "Enable override to manually control mood and pause AI-driven changes."
  );
  const toggleRow = createEl("div", "override-toggle-row");
  const toggleButton = createEl("button", "override-toggle-btn", "Enable DJ Override");
  toggleButton.type = "button";
  const modeLabel = createEl("span", "override-mode-label", "Mode: AI Auto");
  const grid = createEl("div", "sentiment-grid");
  const feedback = createEl("div", "override-feedback", "");
  let overrideEnabled = false;

  const buttons = SENTIMENTS.map((sentiment) => {
    const button = createEl("button", "sentiment-btn", sentiment);
    button.type = "button";
    button.dataset.sentiment = sentiment;
    grid.appendChild(button);
    return button;
  });

  function applyOverrideState(enabled) {
    overrideEnabled = enabled;
    toggleButton.textContent = enabled ? "Disable DJ Override" : "Enable DJ Override";
    modeLabel.textContent = enabled ? "Mode: DJ Override" : "Mode: AI Auto";
    grid.style.display = enabled ? "grid" : "none";
    feedback.textContent = enabled
      ? 'Override enabled. Pick a mood to force next track.'
      : "Override disabled. AI controls track selection.";
    onOverrideStateChange?.(overrideEnabled);
  }

  async function handleClick(event) {
    const button = event.target.closest("button[data-sentiment]");
    if (!button || !overrideEnabled) return;

    const { sentiment } = button.dataset;
    buttons.forEach((b) => {
      b.disabled = true;
      b.classList.toggle("active", b === button);
    });
    feedback.textContent = `Requesting "${sentiment}" override...`;

    try {
      await onSentimentClick?.(sentiment);
      feedback.textContent = `Override applied: ${sentiment}`;
    } catch (error) {
      feedback.textContent = `Override failed: ${error.message}`;
    } finally {
      buttons.forEach((b) => {
        b.disabled = false;
      });
    }
  }

  toggleButton.addEventListener("click", () => {
    applyOverrideState(!overrideEnabled);
  });
  grid.addEventListener("click", handleClick);
  toggleRow.append(toggleButton, modeLabel);
  container.append(title, subtitle, toggleRow, grid, feedback);
  rootElement.appendChild(container);
  applyOverrideState(false);

  return {
    setFeedback(message) {
      feedback.textContent = message;
    },
    isOverrideEnabled() {
      return overrideEnabled;
    },
    setOverrideEnabled(enabled) {
      applyOverrideState(Boolean(enabled));
    },
  };
}
