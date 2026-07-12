import { CONFIG } from "./config.js";
import { preloadAll } from "./assetLoader.js";
import { Game } from "./game.js";

const canvas = document.getElementById("game");
canvas.width = CONFIG.WIDTH;
canvas.height = CONFIG.HEIGHT;

const loadingEl = document.getElementById("loading");
const progressFill = document.getElementById("progress-fill");
const progressLabel = document.getElementById("progress-label");

function setProgress(p) {
  const pct = Math.round(p * 100);
  progressFill.style.width = pct + "%";
  progressLabel.textContent = pct + "%";
}

async function boot() {
  setProgress(0);
  await preloadAll(setProgress);

  const game = new Game(canvas);
  requestAnimationFrame(game.loop);

  loadingEl.classList.add("hidden");
  canvas.classList.add("ready");
  setTimeout(() => loadingEl.remove(), 400);
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}

boot();
