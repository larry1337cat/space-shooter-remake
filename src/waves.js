import { CONFIG } from "./config.js";
import { Enemy, Boss } from "./entities.js";

function grid(type, cols, rows, startY, gapY) {
  const list = [];
  const usableW = CONFIG.WIDTH - 80;
  const gapX = usableW / (cols + 1);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = 40 + gapX * (c + 1) - 24;
      const y = startY - r * gapY;
      list.push({ type, x, y });
    }
  }
  return list;
}

export const STAGES = [
  {
    id: 1,
    name: "Stage 1 — Vành Đai Ngoài",
    bgKey: "bgStage1",
    musicKey: "stage1",
    waves: [
      grid("e1", 5, 2, 60, 70),
      [...grid("e1", 3, 2, 60, 70), ...grid("e2", 3, 1, 40, 0)],
      grid("e2", 4, 2, 60, 70),
    ],
  },
  {
    id: 2,
    name: "Stage 2 — Vùng Tranh Chấp",
    bgKey: "bgStage2",
    musicKey: "stage2",
    waves: [
      [...grid("e2", 3, 2, 60, 80), ...grid("e3", 3, 1, 30, 0)],
      [...grid("e1", 4, 2, 60, 70), ...grid("e4", 2, 1, 40, 0)],
      grid("e3", 4, 2, 60, 90),
      [...grid("e4", 3, 2, 60, 80), ...grid("e2", 3, 1, 30, 0)],
    ],
  },
  {
    id: 3,
    name: "Stage 3 — Lõi Void",
    bgKey: "bgStage3",
    musicKey: "boss",
    waves: [
      [...grid("e4", 4, 2, 60, 80), ...grid("e5", 2, 2, 40, 60)],
      [...grid("e6", 3, 2, 60, 80), ...grid("e3", 3, 1, 30, 0)],
      [...grid("e5", 4, 2, 60, 70), ...grid("e6", 3, 1, 30, 0)],
      { boss: true },
    ],
  },
  {
    id: 4,
    name: "Stage 4 — Vực Thẳm",
    bgKey: "bgStage4",
    musicKey: "boss",
    waves: [
      [...grid("e7", 4, 2, 60, 80), ...grid("e9", 2, 1, 30, 0)],
      [...grid("e8", 3, 2, 60, 80), ...grid("e7", 3, 1, 30, 0)],
      [...grid("e9", 3, 2, 60, 80), ...grid("e8", 3, 1, 30, 0)],
      { boss: true },
    ],
  },
  {
    id: 5,
    name: "Stage 5 — Hành Tinh Đẫm Máu",
    bgKey: "bgStage5",
    musicKey: "boss",
    waves: [
      [...grid("e10", 4, 3, 60, 70), ...grid("e7", 3, 2, 30, 60)],
      [...grid("e11", 3, 2, 60, 100), ...grid("e10", 4, 2, 30, 70), ...grid("e8", 2, 1, 20, 0)],
      [...grid("e12", 5, 2, 50, 70), ...grid("e9", 3, 2, 30, 90)],
      [...grid("e10", 3, 2, 60, 70), ...grid("e11", 3, 2, 30, 90), ...grid("e12", 4, 1, 20, 0)],
      { boss: true },
    ],
  },
];

export function buildWaveEnemies(stageId, waveIndex) {
  const stage = STAGES.find((s) => s.id === stageId);
  const waveDef = stage.waves[waveIndex];
  if (waveDef.boss) {
    return { enemies: [], boss: new Boss(stageId) };
  }
  const enemies = waveDef.map((d) => new Enemy(d.type, d.x, d.y));
  return { enemies, boss: null };
}

export function getStage(stageId) {
  return STAGES.find((s) => s.id === stageId);
}
