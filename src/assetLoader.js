import { IMAGE_MANIFEST, AUDIO_MANIFEST, FONT_MANIFEST } from "./config.js";

export const images = {};
export const audio = {};

function loadImage(key, src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => {
      console.warn("Khong tai duoc anh:", src);
      resolve();
    };
    img.src = src;
    images[key] = img;
  });
}

function loadAudio(key, src) {
  return new Promise((resolve) => {
    const a = new Audio(src);
    a.preload = "auto";
    a.oncanplaythrough = () => resolve();
    a.onerror = () => {
      console.warn("Khong tai duoc am thanh:", src);
      resolve();
    };
    audio[key] = a;
    setTimeout(resolve, 4000);
  });
}

function loadFont(name, url) {
  const font = new FontFace(name, `url(${url})`);
  return font
    .load()
    .then((loaded) => {
      document.fonts.add(loaded);
    })
    .catch((err) => {
      console.warn("Khong tai duoc font:", url, err);
    });
}

export async function preloadAll(onProgress) {
  const imgEntries = Object.entries(IMAGE_MANIFEST);
  const criticalAudio = Object.entries(AUDIO_MANIFEST).filter(([key]) => key === "menu");
  const deferredAudio = Object.entries(AUDIO_MANIFEST).filter(([key]) => key !== "menu");
  const total = imgEntries.length + criticalAudio.length + FONT_MANIFEST.length;
  let done = 0;

  const tick = () => {
    done++;
    if (onProgress) onProgress(done / total);
  };

  const tasks = [];
  for (const [key, path] of imgEntries) {
    tasks.push(loadImage(key, "assets/" + path).then(tick));
  }
  for (const [key, path] of criticalAudio) {
    tasks.push(loadAudio(key, "assets/" + path).then(tick));
  }
  for (const f of FONT_MANIFEST) {
    tasks.push(loadFont(f.name, "assets/" + f.url).then(tick));
  }

  await Promise.all(tasks);

  for (const [key, path] of deferredAudio) {
    loadAudio(key, "assets/" + path);
  }
}
