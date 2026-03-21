import { SENTIMENTS } from "./playbackApi.js";

function createEl(tag, className, text = "") {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text) el.textContent = text;
  return el;
}

export function createDjControls(rootElement, { onSentimentClick }) {
  const container = createEl("section", "dj-card");
  const title = createEl("h2", "dj-title", "DJ Override");
  const subtitle = createEl(
    "p",
    "dj-subtitle",
    "Pick a sentiment to fetch a new Spotify recommendation."
  );
  const grid = createEl("div", "sentiment-grid");
  const feedback = createEl("div", "override-feedback", "");

  const buttons = SENTIMENTS.map((sentiment) => {
    const button = createEl("button", "sentiment-btn", sentiment);
    button.type = "button";
    button.dataset.sentiment = sentiment;
    grid.appendChild(button);
    return button;
  });

  async function handleClick(event) {
    const button = event.target.closest("button[data-sentiment]");
    if (!button) return;

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

  grid.addEventListener("click", handleClick);
  container.append(title, subtitle, grid, feedback);
  rootElement.appendChild(container);

  return {
    setFeedback(message) {
      feedback.textContent = message;
    },
  };
}
