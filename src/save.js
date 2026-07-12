import { CONFIG } from "./config.js";

const DEFAULT_SAVE = {
  currency: 0,
  stageUnlocked: 1,
  upgrades: {
    damage: 0,
    maxHealth: 0,
    fireRate: 0,
    shieldCooldown: 0,
    overdrive: 0,
    pierce: 0,
  },
  skillUnlocked: {
    shield: true,
    overdrive: false,
    pierce: true,
  },
  settings: {
    musicVolume: 0.5,
    sfxVolume: 0.6,
    muted: false,
    godMode: false,
  },
};

export function loadSave() {
  try {
    const raw = localStorage.getItem(CONFIG.SAVE_KEY);
    if (!raw) return structuredClone(DEFAULT_SAVE);
    const parsed = JSON.parse(raw);
    return {
      ...structuredClone(DEFAULT_SAVE),
      ...parsed,
      upgrades: { ...DEFAULT_SAVE.upgrades, ...(parsed.upgrades || {}) },
      skillUnlocked: {
        ...DEFAULT_SAVE.skillUnlocked,
        ...(parsed.skillUnlocked || {}),
      },
      settings: { ...DEFAULT_SAVE.settings, ...(parsed.settings || {}) },
    };
  } catch (e) {
    console.warn("Save data loi, dung mac dinh:", e);
    return structuredClone(DEFAULT_SAVE);
  }
}

export function writeSave(data) {
  try {
    localStorage.setItem(CONFIG.SAVE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn("Khong the ghi save:", e);
  }
}

export function resetSave() {
  localStorage.removeItem(CONFIG.SAVE_KEY);
  return structuredClone(DEFAULT_SAVE);
}
