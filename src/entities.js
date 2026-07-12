import { images } from "./assetLoader.js";
import { CONFIG } from "./config.js";

export function aimVelocity(fromX, fromY, toX, toY, speed) {
  const angle = Math.atan2(toY - fromY, toX - fromX);
  return { vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed };
}

export class Player {
  constructor(stats) {
    this.w = 64;
    this.h = 64;
    this.x = CONFIG.WIDTH / 2 - this.w / 2;
    this.y = CONFIG.HEIGHT - 140;
    this.maxHealth = 100 + stats.upgrades.maxHealth * 20;
    this.health = this.maxHealth;
    this.damage = 10 + stats.upgrades.damage * 2;
    this.fireCooldownMax = Math.max(90, 260 - stats.upgrades.fireRate * 15);
    this.fireCooldown = 0;
    this.invuln = 0;

    this.shieldUnlocked = stats.skillUnlocked.shield;
    this.shieldActive = 0;
    this.shieldCooldown = 0;
    this.shieldDuration = 2500;
    this.shieldCooldownMax = 9000 - stats.upgrades.shieldCooldown * 500;

    this.overdriveUnlocked = stats.skillUnlocked.overdrive;
    this.overdriveActive = 0;
    this.overdriveCooldown = 0;
    this.overdriveDuration = 4000 + stats.upgrades.overdrive * 300;
    this.overdriveCooldownMax = 12000 - stats.upgrades.overdrive * 750;

    this.pierceUnlocked = stats.skillUnlocked.pierce;
    this.pierceActive = 0;
    this.pierceCooldown = 0;
    this.pierceDuration = 3500 + stats.upgrades.pierce * 250;
    this.pierceCooldownMax = 10000 - stats.upgrades.pierce * 500;
    this.pierceHits = 2 + Math.floor(stats.upgrades.pierce / 2);

    this.comboCount = 0;
    this.comboTimer = 0;
    this.comboTimeout = 2200;

    this.smokeTimer = 0;
  }

  get shieldState() {
    if (this.shieldActive > 0) return "active";
    if (this.shieldCooldown > 0) return "cooldown";
    return "ready";
  }

  get overdriveState() {
    if (this.overdriveActive > 0) return "active";
    if (this.overdriveCooldown > 0) return "cooldown";
    return "ready";
  }

  get pierceState() {
    if (this.pierceActive > 0) return "active";
    if (this.pierceCooldown > 0) return "cooldown";
    return "ready";
  }

  get comboMultiplier() {
    return 1 + Math.min(0.5, Math.floor(this.comboCount / 10) * 0.1);
  }

  activateShield() {
    if (this.shieldState !== "ready") return;
    this.shieldActive = this.shieldDuration;
  }

  activateOverdrive() {
    if (this.overdriveState !== "ready") return;
    this.overdriveActive = this.overdriveDuration;
  }

  activatePierce() {
    if (this.pierceState !== "ready") return;
    this.pierceActive = this.pierceDuration;
  }

  registerHit() {
    this.comboCount++;
    this.comboTimer = this.comboTimeout;
  }

  update(dt, input) {
    this.x += input.dx;
    this.y += input.dy;
    this.x = Math.max(10, Math.min(CONFIG.WIDTH - this.w - 10, this.x));
    this.y = Math.max(CONFIG.HEIGHT * 0.45, Math.min(CONFIG.HEIGHT - this.h - 20, this.y));

    if (this.invuln > 0) this.invuln -= dt;

    if (this.shieldActive > 0) {
      this.shieldActive -= dt;
      if (this.shieldActive <= 0) {
        this.shieldActive = 0;
        this.shieldCooldown = this.shieldCooldownMax;
      }
    } else if (this.shieldCooldown > 0) {
      this.shieldCooldown -= dt;
    }

    if (this.overdriveActive > 0) {
      this.overdriveActive -= dt;
      if (this.overdriveActive <= 0) {
        this.overdriveActive = 0;
        this.overdriveCooldown = this.overdriveCooldownMax;
      }
    } else if (this.overdriveCooldown > 0) {
      this.overdriveCooldown -= dt;
    }

    if (this.pierceActive > 0) {
      this.pierceActive -= dt;
      if (this.pierceActive <= 0) {
        this.pierceActive = 0;
        this.pierceCooldown = this.pierceCooldownMax;
      }
    } else if (this.pierceCooldown > 0) {
      this.pierceCooldown -= dt;
    }

    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.comboTimer = 0;
        this.comboCount = 0;
      }
    }

    if (this.fireCooldown > 0) this.fireCooldown -= dt;
    if (this.smokeTimer > 0) this.smokeTimer -= dt;
  }

  tryFire(bulletList) {
    if (this.fireCooldown > 0) return false;
    this.fireCooldown = this.overdriveActive > 0 ? this.fireCooldownMax * 0.45 : this.fireCooldownMax;
    const pierce = this.pierceActive > 0 ? this.pierceHits : 0;
    bulletList.push(
      new Bullet(this.x + this.w / 2 - 6, this.y - 10, 0, -9, this.damage, "player", pierce > 0 ? "bulletAimed" : undefined, pierce)
    );
    return true;
  }

  takeDamage(amount) {
    if (this.invuln > 0) return false;
    if (this.shieldActive > 0) return false;
    this.health -= amount;
    this.invuln = 500;
    this.comboCount = 0;
    this.comboTimer = 0;
    return true;
  }

  thrusterPoint() {
    return { x: this.x + this.w / 2, y: this.y + this.h - 6 };
  }

  draw(ctx) {
    const img = images.ship;
    if (this.invuln > 0 && Math.floor(this.invuln / 80) % 2 === 0) return;
    if (img) ctx.drawImage(img, this.x, this.y, this.w, this.h);

    if (this.shieldActive > 0) {
      ctx.save();
      ctx.strokeStyle = "rgba(90,220,255,0.85)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(this.x + this.w / 2, this.y + this.h / 2, this.w * 0.75, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }
}

export class Bullet {
  constructor(x, y, vx, vy, damage, owner, imgKey, pierce = 0, opts = {}) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.w = pierce > 0 ? 16 : 12;
    this.h = pierce > 0 ? 26 : 20;
    this.damage = damage;
    this.owner = owner;
    this.imgKey = imgKey || (owner === "player" ? "bulletBlue" : "bulletRed");
    this.pierceLeft = pierce;
    this.hitTargets = new Set();
    this.dead = false;

    // Special-attack visuals/behavior (used by tougher boss skills)
    this.homing = opts.homing || false;
    this.turnRate = opts.turnRate ?? 0.05;
    this.maxSpeed = opts.maxSpeed ?? Math.hypot(vx, vy);
    this.glowColor = opts.glowColor || null;
    this.scaleMul = opts.scaleMul || 1;
    if (this.scaleMul !== 1) {
      this.w *= this.scaleMul;
      this.h *= this.scaleMul;
    }
    if (opts.width) this.w = opts.width;
    if (opts.height) this.h = opts.height;
  }

  update(dt, player) {
    const t = dt / 16.67;
    if (this.homing && player) {
      const targetAngle = Math.atan2(player.y + player.h / 2 - this.y, player.x + player.w / 2 - this.x);
      const curAngle = Math.atan2(this.vy, this.vx);
      let diff = targetAngle - curAngle;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      const turn = Math.max(-this.turnRate, Math.min(this.turnRate, diff));
      const newAngle = curAngle + turn;
      this.vx = Math.cos(newAngle) * this.maxSpeed;
      this.vy = Math.sin(newAngle) * this.maxSpeed;
    }
    this.x += this.vx * t;
    this.y += this.vy * t;
    // Cleanup margin must scale with sprite size: big boss "planet" bullets
    // (stage3/4/5 art) spawn well above the screen (y as low as -230, up to
    // 130px tall) so they can drift slowly into view. A flat 40px margin
    // killed them the instant they were created, before a single frame ever
    // rendered. Use the sprite's own size as the margin instead.
    const margin = Math.max(this.w, this.h) + 200;
    if (this.y < -margin || this.y > CONFIG.HEIGHT + margin || this.x < -margin || this.x > CONFIG.WIDTH + margin) {
      this.dead = true;
    }
  }

  registerHit() {
    if (this.pierceLeft > 0) {
      this.pierceLeft--;
      return false;
    }
    this.dead = true;
    return true;
  }

  draw(ctx) {
    const img = images[this.imgKey];
    ctx.save();
    if (this.glowColor) {
      ctx.shadowColor = this.glowColor;
      ctx.shadowBlur = 14;
    } else if (this.pierceLeft > 0 || this.imgKey === "bulletAimed") {
      ctx.shadowColor = "#ffd54a";
      ctx.shadowBlur = 8;
    }
    if (img) ctx.drawImage(img, this.x, this.y, this.w, this.h);
    else {
      ctx.fillStyle = this.glowColor || (this.owner === "player" ? "#5ad" : "#e55");
      ctx.fillRect(this.x, this.y, this.w, this.h);
    }
    ctx.restore();
  }
}

export class Explosion {
  constructor(x, y, scale = 1) {
    this.x = x;
    this.y = y;
    this.scale = scale;
    this.t = 0;
    this.duration = 420;
    this.dead = false;
  }
  update(dt) {
    this.t += dt;
    if (this.t >= this.duration) this.dead = true;
  }
  draw(ctx) {
    const img = images.explosion;
    const p = Math.min(1, this.t / this.duration);
    const size = 60 * this.scale * (0.6 + 0.6 * p);
    ctx.save();
    ctx.globalAlpha = 1 - p;
    if (img) {
      ctx.drawImage(img, this.x - size / 2, this.y - size / 2, size, size);
    } else {
      ctx.fillStyle = "#ffb74d";
      ctx.beginPath();
      ctx.arc(this.x, this.y, size / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

export class Spark {
  constructor(x, y, color = "#ffd54a") {
    this.x = x;
    this.y = y;
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.5 + Math.random() * 3;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.size = 2 + Math.random() * 3;
    this.color = color;
    this.t = 0;
    this.duration = 300 + Math.random() * 200;
    this.dead = false;
  }
  update(dt) {
    const f = dt / 16.67;
    this.x += this.vx * f;
    this.y += this.vy * f;
    this.vx *= 0.94;
    this.vy *= 0.94;
    this.t += dt;
    if (this.t >= this.duration) this.dead = true;
  }
  draw(ctx) {
    const p = this.t / this.duration;
    ctx.save();
    ctx.globalAlpha = 1 - p;
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
    ctx.restore();
  }
}

export class Smoke {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 0.5;
    this.vy = 1 + Math.random() * 0.8;
    this.size = 4 + Math.random() * 4;
    this.t = 0;
    this.duration = 400 + Math.random() * 250;
    this.dead = false;
  }
  update(dt) {
    const f = dt / 16.67;
    this.x += this.vx * f;
    this.y += this.vy * f;
    this.size += 0.05 * f;
    this.t += dt;
    if (this.t >= this.duration) this.dead = true;
  }
  draw(ctx) {
    const p = this.t / this.duration;
    ctx.save();
    ctx.globalAlpha = (1 - p) * 0.35;
    ctx.fillStyle = "#9fb3c8";
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export class Shockwave {
  constructor(x, y, color = "#ff5252", maxRadius = 160, duration = 550) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.maxRadius = maxRadius;
    this.duration = duration;
    this.t = 0;
    this.dead = false;
  }
  update(dt) {
    this.t += dt;
    if (this.t >= this.duration) this.dead = true;
  }
  draw(ctx) {
    const p = Math.min(1, this.t / this.duration);
    const r = this.maxRadius * p;
    ctx.save();
    ctx.globalAlpha = (1 - p) * 0.85;
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 7 * (1 - p) + 2;
    ctx.beginPath();
    ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

export class WarnMarker {
  constructor(x, y, color = "#ff5252", radius = 26, duration = 500) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.radius = radius;
    this.duration = duration;
    this.t = 0;
    this.dead = false;
  }
  update(dt) {
    this.t += dt;
    if (this.t >= this.duration) this.dead = true;
  }
  draw(ctx) {
    const p = this.t / this.duration;
    const pulse = 0.6 + 0.4 * Math.sin(p * Math.PI * 8);
    ctx.save();
    ctx.globalAlpha = 0.75 * pulse;
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 0.25 * pulse;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export class WarnLine {
  constructor(x, y, angle, length, color = "#ff5252", duration = 500) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.length = length;
    this.color = color;
    this.duration = duration;
    this.t = 0;
    this.dead = false;
  }
  update(dt) {
    this.t += dt;
    if (this.t >= this.duration) this.dead = true;
  }
  draw(ctx) {
    const p = this.t / this.duration;
    const pulse = 0.5 + 0.5 * Math.sin(p * Math.PI * 10);
    ctx.save();
    ctx.globalAlpha = 0.55 * pulse;
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 8]);
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x + Math.cos(this.angle) * this.length, this.y + Math.sin(this.angle) * this.length);
    ctx.stroke();
    ctx.restore();
  }
}

// AoE ground hazard: telegraphs briefly, then deals damage once if the
// player is caught inside its radius while it detonates. Drained from
// Boss.hazardQueue by the game loop (see Game._drainBossHazards).
export class ExplosionHazard {
  constructor(x, y, radius = 50, damage = 20) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.damage = damage;
    this.t = 0;
    this.telegraph = 520;
    this.active = 260;
    this.duration = this.telegraph + this.active;
    this.applied = false;
    this.dead = false;
  }
  get isDangerous() {
    return this.t >= this.telegraph && this.t < this.duration;
  }
  update(dt) {
    this.t += dt;
    if (this.t >= this.duration) this.dead = true;
  }
  draw(ctx) {
    if (this.t < this.telegraph) return;
    const p = (this.t - this.telegraph) / this.active;
    const img = images.explosionHazard;
    const size = this.radius * 2 * (0.7 + 0.5 * p);
    ctx.save();
    ctx.globalAlpha = 1 - p;
    if (img) {
      ctx.drawImage(img, this.x - size / 2, this.y - size / 2, size, size);
    } else {
      ctx.fillStyle = "#ff7043";
      ctx.beginPath();
      ctx.arc(this.x, this.y, size / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

export function spawnBurst(x, y, { scale = 1, sparkCount = 6, color = "#ffd54a" } = {}) {
  const list = [new Explosion(x, y, scale)];
  for (let i = 0; i < sparkCount; i++) list.push(new Spark(x, y, color));
  return list;
}

export function spawnSparks(x, y, count = 4, color = "#ffd54a") {
  const list = [];
  for (let i = 0; i < count; i++) list.push(new Spark(x, y, color));
  return list;
}

export class Pickup {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.w = 28;
    this.h = 28;
    this.vy = 2;
    this.dead = false;
  }
  update(dt) {
    this.y += this.vy * (dt / 16.67);
    if (this.y > CONFIG.HEIGHT + 40) this.dead = true;
  }
  draw(ctx) {
    const img = images[this.type];
    if (img) ctx.drawImage(img, this.x, this.y, this.w, this.h);
  }
}

const ENEMY_DEFS = {
  e1: { img: "enemy1", hp: 26, w: 48, h: 48, speed: 1.6, fireRate: 0, straightShot: true },
  e2: { img: "enemy2", hp: 40, w: 48, h: 48, speed: 1.3, fireRate: 1850, aimed: true, wave: true },
  e3: { img: "enemy3Turret", hp: 62, w: 52, h: 52, speed: 0, fireRate: 1150, aimed: true },
  e4: { img: "enemy4", hp: 74, w: 52, h: 52, speed: 1.85, fireRate: 1500, aimed: true, wave: true },
  e5: { img: "enemy5", hp: 54, w: 48, h: 48, speed: 2.35, fireRate: 0, straightShot: true },
  e6: { img: "enemy6", hp: 94, w: 56, h: 56, speed: 1.15, fireRate: 1050, aimed: true, wave: true },
  e7: { img: "enemy7", hp: 80, w: 48, h: 48, speed: 2.75, fireRate: 0, straightShot: true },
  e8: { img: "enemy8", hp: 88, w: 52, h: 52, speed: 1.5, fireRate: 1300, aimed: true, wave: true },
  e9: { img: "enemy9", hp: 120, w: 56, h: 56, speed: 0, fireRate: 900, aimed: true },
  e10: { img: "enemy10", hp: 150, w: 46, h: 48, speed: 1.85, fireRate: 1050, aimed: true, wave: true },
  e11: { img: "enemy11", hp: 230, w: 64, h: 52, speed: 0, fireRate: 1150, aimed: true, spread: 4 },
  e12: { img: "enemy12", hp: 72, w: 42, h: 54, speed: 3.7, kamikaze: true, contactDamage: 28 },
};

export class Enemy {
  constructor(type, x, y) {
    const def = ENEMY_DEFS[type];
    this.type = type;
    this.def = def;
    this.x = x;
    this.y = y;
    this.startX = x;
    this.w = def.w;
    this.h = def.h;
    this.hp = def.hp;
    this.maxHp = def.hp;
    this.speed = def.speed;
    this.t = Math.random() * 1000;
    this.fireTimer = def.fireRate ? Math.random() * def.fireRate : 0;
    this.dead = false;
  }

  update(dt, player, bulletList) {
    this.t += dt;
    if (this.y > CONFIG.HEIGHT + 80) {
      this.dead = true;
      return;
    }
    if (this.y < 90) {
      this.y += Math.max(this.speed, 1.2) * (dt / 16.67);
    } else if (this.def.kamikaze) {
      this._diveTowardPlayer(dt, player);
    } else if (this.def.wave) {
      this.x = this.startX + Math.sin(this.t / 700) * 60;
    }

    if (this.def.fireRate) {
      this.fireTimer -= dt;
      if (this.fireTimer <= 0) {
        this.fireTimer = this.def.fireRate;
        this._fire(player, bulletList);
      }
    } else if (this.def.straightShot && this.y > 20 && this.y < CONFIG.HEIGHT - 250) {
      this.fireTimer -= dt;
      if (this.fireTimer <= 0) {
        this.fireTimer = 1250 + Math.random() * 650;
        bulletList.push(new Bullet(this.x + this.w / 2 - 6, this.y + this.h, 0, 5.2, 10, "enemy", "enemyBulletStraight"));
      }
    }
  }

  _diveTowardPlayer(dt, player) {
    const f = dt / 16.67;
    const dx = player.x + player.w / 2 - (this.x + this.w / 2);
    const maxStep = this.speed * 0.65 * f;
    this.x += Math.sign(dx) * Math.min(Math.abs(dx), maxStep);
    this.y += this.speed * f;
  }

  _fire(player, bulletList) {
    const fromX = this.x + this.w / 2;
    const fromY = this.y + this.h;
    if (this.def.spread) {
      const baseAngle = Math.atan2(player.y + player.h / 2 - fromY, player.x + player.w / 2 - fromX);
      const step = 0.22;
      for (let i = 0; i < this.def.spread; i++) {
        const angle = baseAngle + (i - (this.def.spread - 1) / 2) * step;
        bulletList.push(new Bullet(fromX - 6, fromY, Math.cos(angle) * 4.6, Math.sin(angle) * 4.6, 11, "enemy", "bulletAimed"));
      }
      return;
    }
    const { vx, vy } = aimVelocity(fromX, fromY, player.x + player.w / 2, player.y + player.h / 2, 4.7);
    bulletList.push(new Bullet(fromX - 6, fromY, vx, vy, 11, "enemy", "bulletAimed"));
  }

  takeDamage(dmg) {
    this.hp -= dmg;
    if (this.hp <= 0) this.dead = true;
  }

  draw(ctx) {
    const img = images[this.def.img];
    if (img) ctx.drawImage(img, this.x, this.y, this.w, this.h);
    if (this.hp < this.maxHp) {
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(this.x, this.y - 8, this.w, 5);
      ctx.fillStyle = "#4caf50";
      ctx.fillRect(this.x, this.y - 8, this.w * Math.max(0, this.hp / this.maxHp), 5);
    }
  }
}

const BOSS_IMG_BY_STAGE = { 1: "boss", 2: "boss", 3: "boss1", 4: "boss4", 5: "boss5" };
const ECHO_HP_FRACTION = 0.4;
const STAGE5_MAX_ALLIES = 4;

// Stages 3-5 run the full named-skill pattern kit on top of (or instead of)
// their base fire. Stage 1-2 bosses keep the simpler continuous _fireBurst.
const PATTERN_KIT_STAGES = new Set([3, 4, 5]);

const PATTERN_SETS = {
  3: ["chainRing", "bulletRain", "orbBarrage", "orbNova"],
  4: ["planetSummon", "explosionField", "orbBarrage", "orbNova"],
  5: ["dash", "radial", "laser", "summon", "spiral", "homing", "meteor", "shockwave", "planetUltimate", "orbBarrage", "orbNova"],
};

// Base cooldown per named skill. Phase multipliers make the fight ramp up
// as the boss loses HP (see PHASE_COOLDOWN_MULT).
const PATTERN_COOLDOWN_BASE = {
  dash: 4200,
  radial: 2900,
  laser: 4300,
  summon: 6200,
  spiral: 5200,
  homing: 4600,
  meteor: 5800,
  shockwave: 7200,
  planetUltimate: 9000,
  chainRing: 5400,
  bulletRain: 6200,
  planetSummon: 7400,
  explosionField: 6800,
  orbBarrage: 5000,
  orbNova: 5600,
};
// Which patterns unlock at which boss phase (1 = full hp, 3 = enrage <30%)
const PATTERN_MIN_PHASE = {
  dash: 1,
  radial: 1,
  laser: 1,
  summon: 1,
  spiral: 2,
  homing: 2,
  meteor: 3,
  shockwave: 3,
  planetUltimate: 3,
  chainRing: 1,
  bulletRain: 2,
  planetSummon: 1,
  explosionField: 2,
  orbBarrage: 1,
  orbNova: 1,
};
// Phase-3 skill chains: once the first pattern ends, its partner fires
// immediately with no idle gap, capped at a chain length of 2.
const COMBO_PAIRS = {
  3: { chainRing: "bulletRain", bulletRain: "chainRing" },
  4: { planetSummon: "explosionField", explosionField: "planetSummon" },
  5: { shockwave: "laser", laser: "shockwave", spiral: "homing", homing: "spiral", meteor: "radial" },
};
const PHASE_COOLDOWN_MULT = { 1: 1, 2: 0.78, 3: 0.55 };
const PHASE_HP_THRESHOLDS = { 2: 0.65, 3: 0.3 };

function buildInitialCooldowns(patterns) {
  const out = {};
  for (const name of patterns) out[name] = Math.round(PATTERN_COOLDOWN_BASE[name] * 0.4);
  return out;
}

export class Boss {
  constructor(stageNum) {
    this.stageNum = stageNum;
    this.w = 160;
    this.h = 160;
    this.x = CONFIG.WIDTH / 2 - this.w / 2;
    this.y = -this.h;
    this.targetY = 60;
    this.maxHp = stageNum === 5 ? 9500 : 1300 + stageNum * 750;
    this.hp = this.maxHp;
    this.phase = 1;
    this.t = 0;
    this.fireTimer = 1000;
    this.dead = false;
    this.imgKey = BOSS_IMG_BY_STAGE[stageNum] || "boss1";

    this.summonQueue = [];
    this.hazardQueue = [];
    this.dashing = false;
    this.dashDamage = 26;
    this.echoSummoned = false;
    this.openingFired = false;
    // Screen-level fx requests (shake/flash) drained by the game loop each frame.
    this.fxQueue = [];

    if (PATTERN_KIT_STAGES.has(stageNum)) {
      this.homeX = this.x;
      this.pattern = null;
      this.patternTimer = 0;
      this.pendingPattern = null;
      this.pendingTimer = 0;
      this.comboActive = false;
      this.patterns = PATTERN_SETS[stageNum];
      this.cooldowns = buildInitialCooldowns(this.patterns);
    }
  }

  update(dt, player, bulletList, allyCount = 0, particles) {
    this.t += dt;
    if (this.y < this.targetY && !this.dashing) {
      this.y += 2 * (dt / 16.67);
      return;
    }

    if (PATTERN_KIT_STAGES.has(this.stageNum)) {
      this._updatePatternKit(dt, player, bulletList, allyCount, particles);
      return;
    }

    this._updatePhase(particles);

    const speedDiv = 950 - (this.phase - 1) * 160;
    this.x = CONFIG.WIDTH / 2 - this.w / 2 + Math.sin(this.t / speedDiv) * 90;

    this.fireTimer -= dt;
    const rate = this.phase === 3 ? 340 : this.phase === 2 ? 530 : 850;
    if (this.fireTimer <= 0) {
      this.fireTimer = rate;
      this._fireBurst(player, bulletList);
    }
  }

  _updatePhase(particles) {
    const frac = this.hp / this.maxHp;
    let newPhase = 1;
    if (frac <= PHASE_HP_THRESHOLDS[3]) newPhase = 3;
    else if (frac <= PHASE_HP_THRESHOLDS[2]) newPhase = 2;
    if (newPhase !== this.phase) {
      this.phase = newPhase;
      this.fxQueue.push({ type: "shake", amount: newPhase === 3 ? 16 : 11 });
      this.fxQueue.push({
        type: "flash",
        color: newPhase === 3 ? "rgba(198,40,40,0.42)" : "rgba(255,152,0,0.32)",
        duration: 260,
      });
      if (particles) {
        particles.push(new Shockwave(this.x + this.w / 2, this.y + this.h / 2, newPhase === 3 ? "#8e24aa" : "#ff9800", 190, 520));
      }
    }
  }

  _fireBurst(player, bulletList) {
    const fromX = this.x + this.w / 2;
    const fromY = this.y + this.h - 10;
    if (this.phase === 1) {
      const { vx, vy } = aimVelocity(fromX, fromY, player.x + player.w / 2, player.y, 4.9);
      bulletList.push(new Bullet(fromX - 6, fromY, vx, vy, 16, "enemy", "bulletAimed"));
      return;
    }
    const spread = this.phase === 3 ? 4 : 2;
    const speed = this.phase === 3 ? 5.3 : 4.7;
    for (let i = -spread; i <= spread; i++) {
      const angle = Math.atan2(player.y - fromY, player.x - fromX) + i * 0.2;
      bulletList.push(new Bullet(fromX - 6, fromY, Math.cos(angle) * speed, Math.sin(angle) * speed, 13, "enemy", "bulletAimed"));
    }
    if (this.phase === 3 && Math.random() < 0.4) {
      const { vx, vy } = aimVelocity(fromX, fromY, player.x + player.w / 2, player.y + player.h / 2, 4.1);
      bulletList.push(
        new Bullet(fromX - 6, fromY, vx, vy, 11, "enemy", "bulletAimed", 0, { homing: true, turnRate: 0.04, maxSpeed: 4.6, glowColor: "#ff8a65" })
      );
    }
  }

  // ---------------- Stage 3-5: named-skill pattern kit ----------------

  _updatePatternKit(dt, player, bulletList, allyCount, particles) {
    this._updatePhase(particles);

    if (this.stageNum === 5) {
      if (!this.openingFired) {
        this.openingFired = true;
        this._fireOpeningPlanet(bulletList);
      }
      if (!this.echoSummoned && this.hp <= this.maxHp * 0.2) {
        this.echoSummoned = true;
        this.summonQueue.push({ type: "echo", stage: 1 + Math.floor(Math.random() * 4) });
      }
    }

    for (const key in this.cooldowns) {
      if (this.cooldowns[key] > 0) this.cooldowns[key] -= dt;
    }

    if (this.pendingPattern) {
      this.pendingTimer -= dt;
      if (this.pendingTimer <= 0) {
        const name = this.pendingPattern;
        this.pendingPattern = null;
        this._launchPattern(name, player, bulletList, particles);
      }
    } else if (this.pattern) {
      this._runPattern(dt, player, bulletList, particles);
    } else {
      if (!this.dashing) {
        this.x = this.homeX + Math.sin(this.t / (900 - (this.phase - 1) * 120)) * (this.stageNum === 5 ? 100 : 90);
      }
      const ready = this.patterns.filter((k) => {
        if (this.cooldowns[k] > 0) return false;
        if ((PATTERN_MIN_PHASE[k] || 1) > this.phase) return false;
        if (k === "summon" && allyCount >= STAGE5_MAX_ALLIES) return false;
        return true;
      });
      if (ready.length > 0) {
        const pick = ready[Math.floor(Math.random() * ready.length)];
        this._queuePattern(pick, player, bulletList, particles);
      }
    }

    // Stage 3/4 keep their baseline burst fire running between named skills;
    // Stage 5 relies purely on the pattern kit for offense.
    if (this.stageNum !== 5 && !this.pattern && !this.pendingPattern) {
      this.fireTimer -= dt;
      const rate = this.phase === 3 ? 420 : this.phase === 2 ? 620 : 900;
      if (this.fireTimer <= 0) {
        this.fireTimer = rate;
        this._fireBurst(player, bulletList);
      }
    }
  }

  _fireOpeningPlanet(bulletList) {
    const fromX = this.x + this.w / 2;
    bulletList.push(
      new Bullet(fromX - 65, -180, 0, 1.3, 30, "enemy", "stage5", 0, { width: 130, height: 130, glowColor: "#8e24aa" })
    );
    this.fxQueue.push({ type: "shake", amount: 14 });
    this.fxQueue.push({ type: "flash", color: "rgba(142,36,170,0.35)", duration: 300 });
  }

  _queuePattern(name, player, bulletList, particles) {
    const telegraphDuration = { laser: 500, meteor: 650, shockwave: 480 }[name];
    if (telegraphDuration) {
      this.pendingPattern = name;
      this.pendingTimer = telegraphDuration;
      this._spawnTelegraph(name, player, particles);
    } else {
      this._launchPattern(name, player, bulletList, particles);
    }
  }

  _spawnTelegraph(name, player, particles) {
    const fromX = this.x + this.w / 2;
    const fromY = this.y + this.h - 10;
    if (!particles) return;
    if (name === "laser") {
      this.laserAngle = Math.atan2(player.y + player.h / 2 - fromY, player.x + player.w / 2 - fromX);
      particles.push(new WarnLine(fromX, fromY, this.laserAngle, 900, "#ff1744", 500));
    } else if (name === "meteor") {
      this.meteorCols = [];
      const count = 4 + (this.phase >= 3 ? 2 : 0);
      for (let i = 0; i < count; i++) {
        const x = 40 + Math.random() * (CONFIG.WIDTH - 80);
        this.meteorCols.push(x);
        particles.push(new WarnMarker(x, CONFIG.HEIGHT - 140, "#ff7043", 22, 650));
      }
    } else if (name === "shockwave") {
      particles.push(new WarnMarker(fromX, this.y + this.h / 2, "#c62828", 130, 480));
    }
  }

  _launchPattern(name, player, bulletList, particles) {
    this.pattern = name;
    this.patternTimer = 0;

    if (name === "laser") {
      const fromX = this.x + this.w / 2;
      const fromY = this.y + this.h - 10;
      const baseAngle = this.laserAngle ?? Math.atan2(player.y + player.h / 2 - fromY, player.x + player.w / 2 - fromX);
      this.laserSweepFrom = baseAngle - 0.55;
      this.laserSweepTo = baseAngle + 0.55;
      this.laserShots = 0;
      this.laserTick = 0;
      this.laserTotalShots = this.phase >= 3 ? 26 : 20;
    } else if (name === "dash") {
      this.dashTargetX = Math.max(20, Math.min(CONFIG.WIDTH - this.w - 20, player.x + player.w / 2 - this.w / 2));
      this.dashTargetY = Math.min(CONFIG.HEIGHT - this.h - 220, player.y - 180);
      this.dashPhase = "in";
      this.dashing = true;
      this.dashDamage = 26 + (this.phase - 1) * 7;
    } else if (name === "summon") {
      const pool = this.phase >= 2 ? ["e10", "e11", "e12", "e9"] : ["e10", "e11", "e12"];
      const count = 2 + Math.floor(Math.random() * 2) + (this.phase >= 3 ? 1 : 0);
      for (let i = 0; i < count; i++) {
        const type = pool[Math.floor(Math.random() * pool.length)];
        const x = 40 + Math.random() * (CONFIG.WIDTH - 120);
        this.summonQueue.push({ type: "enemy", enemyType: type, x, y: -60 - i * 60 });
      }
    } else if (name === "spiral") {
      this.spiralAngle = 0;
      this.spiralTicks = 0;
      this.spiralArms = this.phase >= 3 ? 4 : 3;
      this.spiralTotalTicks = this.phase >= 3 ? 50 : 40;
      this.spiralTick = 0;
    } else if (name === "homing") {
      const fromX = this.x + this.w / 2;
      const fromY = this.y + this.h - 10;
      const count = this.phase >= 3 ? 5 : 3;
      for (let i = 0; i < count; i++) {
        const angle = -Math.PI / 2 + (i - (count - 1) / 2) * 0.35;
        bulletList.push(
          new Bullet(fromX - 7, fromY, Math.cos(angle) * 3.4, Math.sin(angle) * 3.4, 14, "enemy", "bulletAimed", 0, {
            homing: true,
            turnRate: 0.045,
            maxSpeed: 5.4,
            glowColor: "#c186ff",
            scaleMul: 1.25,
          })
        );
      }
    } else if (name === "meteor") {
      if (!this.meteorCols) {
        this.meteorCols = [];
        const count = 4 + (this.phase >= 3 ? 2 : 0);
        for (let i = 0; i < count; i++) this.meteorCols.push(40 + Math.random() * (CONFIG.WIDTH - 80));
      }
      this.meteorTimer = 0;
      this.meteorSpawned = false;
    } else if (name === "shockwave") {
      const fromX = this.x + this.w / 2;
      const fromY = this.y + this.h / 2;
      const count = 26 + (this.phase >= 3 ? 8 : 0);
      const speed = 4.4 + (this.phase >= 3 ? 0.6 : 0);
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count;
        bulletList.push(new Bullet(fromX - 6, fromY, Math.cos(angle) * speed, Math.sin(angle) * speed, 13, "enemy", "bulletAimed", 0, { glowColor: "#ff5252" }));
      }
      if (particles) particles.push(new Shockwave(fromX, fromY, "#ff5252", 230, 550));
      this.fxQueue.push({ type: "shake", amount: 12 });
    } else if (name === "chainRing") {
      this.chainRingCount = 0;
      this.chainRingTotal = this.phase >= 3 ? 4 : 3;
      this.chainRingTick = 0;
      this.chainRingAngle = 0;
    } else if (name === "bulletRain") {
      this.rainWave = 0;
      this.rainTotalWaves = this.phase >= 3 ? 4 : 3;
      this.rainTick = 0;
    } else if (name === "explosionField") {
      this.explosionWave = 0;
      this.explosionTotalWaves = this.phase >= 3 ? 5 : 3;
      this.explosionTick = 0;
    } else if (name === "planetSummon") {
      this.planetSummonWave = 0;
      this.planetSummonTotalWaves = this.phase >= 3 ? 3 : 2;
      this.planetSummonTick = 0;
    } else if (name === "planetUltimate") {
      this.planetUltWave = 0;
      this.planetUltTotalWaves = this.phase >= 3 ? 3 : 2;
      this.planetUltTick = 0;
    } else if (name === "orbNova") {
      this.orbNovaWave = 0;
      this.orbNovaTotalWaves = this.phase >= 3 ? 3 : 2;
      this.orbNovaTick = 0;
      this.orbNovaAngle = 0;
    }
  }

  _runPattern(dt, player, bulletList, particles) {
    this._ctx = { player, bulletList, particles };
    this.patternTimer += dt;
    if (this.pattern === "laser") this._runLaser(dt, bulletList);
    else if (this.pattern === "radial") this._runRadial(bulletList);
    else if (this.pattern === "dash") this._runDash(dt);
    else if (this.pattern === "spiral") this._runSpiral(dt, bulletList);
    else if (this.pattern === "meteor") this._runMeteor(dt, bulletList);
    else if (this.pattern === "chainRing") this._runChainRing(dt, bulletList);
    else if (this.pattern === "bulletRain") this._runBulletRain(dt, bulletList);
    else if (this.pattern === "explosionField") this._runExplosionField(dt, particles);
    else if (this.pattern === "planetSummon") this._runPlanetSummon(dt, bulletList);
    else if (this.pattern === "planetUltimate") this._runPlanetUltimate(dt, bulletList);
    else if (this.pattern === "orbBarrage") this._runOrbBarrage(player, bulletList);
    else if (this.pattern === "orbNova") this._runOrbNova(dt, bulletList);
    else if (this.pattern === "summon" && this.patternTimer > 300) this._endPattern();
    else if (this.pattern === "homing" && this.patternTimer > 250) this._endPattern();
    else if (this.pattern === "shockwave" && this.patternTimer > 260) this._endPattern();
  }

  _runChainRing(dt, bulletList) {
    this.chainRingTick += dt;
    if (this.chainRingTick >= 260) {
      this.chainRingTick = 0;
      const fromX = this.x + this.w / 2;
      const fromY = this.y + this.h / 2;
      const count = 18;
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + this.chainRingAngle;
        bulletList.push(new Bullet(fromX - 6, fromY, Math.cos(angle) * 4, Math.sin(angle) * 4, 12, "enemy", "bulletAimed", 0, { glowColor: "#42a5f5" }));
      }
      this.chainRingAngle += 0.3;
      this.chainRingCount++;
    }
    if (this.chainRingCount >= this.chainRingTotal) this._endPattern();
  }

  _runBulletRain(dt, bulletList) {
    this.rainTick += dt;
    if (this.rainTick >= 320) {
      this.rainTick = 0;
      for (let c = 0; c < 3; c++) {
        const baseX = 50 + Math.random() * (CONFIG.WIDTH - 100);
        for (let i = 0; i < 3; i++) {
          const x = baseX + (i - 1) * 22;
          bulletList.push(new Bullet(x - 6, -30, 0, 5.4 + Math.random() * 1.2, 11, "enemy", "enemyBulletStraight", 0, { glowColor: "#29b6f6" }));
        }
      }
      this.rainWave++;
    }
    if (this.rainWave >= this.rainTotalWaves) this._endPattern();
  }

  _runExplosionField(dt, particles) {
    this.explosionTick += dt;
    if (this.explosionTick >= 380) {
      this.explosionTick = 0;
      const x = 50 + Math.random() * (CONFIG.WIDTH - 100);
      const y = CONFIG.HEIGHT * 0.5 + Math.random() * (CONFIG.HEIGHT * 0.32);
      this.hazardQueue.push({ x, y, radius: 50, damage: 20 });
      if (particles) particles.push(new WarnMarker(x, y, "#ff7043", 50, 520));
      this.explosionWave++;
    }
    if (this.explosionWave >= this.explosionTotalWaves) this._endPattern();
  }

  // Continuously summons a fresh trio of stage3-art planets every ~950ms
  // for several waves, instead of a single one-shot burst.
  _runPlanetSummon(dt, bulletList) {
    this.planetSummonTick += dt;
    if (this.planetSummonTick >= 950) {
      this.planetSummonTick = 0;
      const jitter = (Math.random() - 0.5) * CONFIG.WIDTH * 0.08;
      const cols = [CONFIG.WIDTH * 0.22 + jitter, CONFIG.WIDTH * 0.5 - jitter, CONFIG.WIDTH * 0.78 + jitter];
      for (const x of cols) {
        bulletList.push(new Bullet(x - 35, -110, 0, 1.7, 24, "enemy", "stage3", 0, { width: 70, height: 70, glowColor: "#7c4dff" }));
      }
      this.planetSummonWave++;
    }
    if (this.planetSummonWave >= this.planetSummonTotalWaves) this._endPattern();
  }

  // The stage-5 ultimate: continuously hurls a stage5 + stage4 planet pair
  // down alternating lanes every ~1.1s across several waves.
  _runPlanetUltimate(dt, bulletList) {
    this.planetUltTick += dt;
    if (this.planetUltTick >= 1100) {
      this.planetUltTick = 0;
      const flip = this.planetUltWave % 2 === 1;
      const leftX = (flip ? CONFIG.WIDTH * 0.68 : CONFIG.WIDTH * 0.32) - 60;
      const rightX = (flip ? CONFIG.WIDTH * 0.32 : CONFIG.WIDTH * 0.68) - 60;
      bulletList.push(new Bullet(leftX, -190, 0, 1.5, 28, "enemy", "stage5", 0, { width: 120, height: 120, glowColor: "#c62828" }));
      bulletList.push(new Bullet(rightX, -230, 0, 1.5, 28, "enemy", "stage4", 0, { width: 120, height: 120, glowColor: "#6a1b9a" }));
      this.fxQueue.push({ type: "shake", amount: 10 });
      this.planetUltWave++;
    }
    if (this.planetUltWave >= this.planetUltTotalWaves) this._endPattern();
  }

  _runOrbBarrage(player, bulletList) {
    const fromX = this.x + this.w / 2;
    const fromY = this.y + this.h / 2;
    const orbKeys = ["orb1", "orb2", "orb3", "orb4", "orb5", "orb6"];
    const baseAngle = Math.atan2(player.y + player.h / 2 - fromY, player.x + player.w / 2 - fromX);
    orbKeys.forEach((key, i) => {
      const angle = baseAngle + (i - (orbKeys.length - 1) / 2) * 0.22;
      bulletList.push(
        new Bullet(fromX - 13, fromY - 13, Math.cos(angle) * 3.4, Math.sin(angle) * 3.4, 13, "enemy", key, 0, {
          homing: true,
          turnRate: 0.03,
          maxSpeed: 4.6,
          width: 26,
          height: 26,
          glowColor: "#ffca28",
        })
      );
    });
    this._endPattern();
  }

  // New orb-based skill: a slow-spinning ring of all 6 orbs bursts outward
  // (non-homing, unlike orbBarrage) each wave, rotating a bit more per wave
  // so successive rings interleave.
  _runOrbNova(dt, bulletList) {
    this.orbNovaTick += dt;
    if (this.orbNovaTick >= 420) {
      this.orbNovaTick = 0;
      const fromX = this.x + this.w / 2;
      const fromY = this.y + this.h / 2;
      const orbKeys = ["orb1", "orb2", "orb3", "orb4", "orb5", "orb6"];
      orbKeys.forEach((key, i) => {
        const angle = this.orbNovaAngle + (Math.PI * 2 * i) / orbKeys.length;
        bulletList.push(
          new Bullet(fromX - 12, fromY - 12, Math.cos(angle) * 3.9, Math.sin(angle) * 3.9, 12, "enemy", key, 0, {
            width: 24,
            height: 24,
            glowColor: "#ffca28",
          })
        );
      });
      this.orbNovaAngle += 0.5;
      this.orbNovaWave++;
    }
    if (this.orbNovaWave >= this.orbNovaTotalWaves) this._endPattern();
  }

  _runLaser(dt, bulletList) {
    this.laserTick += dt;
    if (this.laserTick >= 45) {
      this.laserTick = 0;
      const p = this.laserShots / this.laserTotalShots;
      const angle = this.laserSweepFrom + (this.laserSweepTo - this.laserSweepFrom) * p;
      const fromX = this.x + this.w / 2;
      const fromY = this.y + this.h - 10;
      bulletList.push(
        new Bullet(fromX - 7, fromY, Math.cos(angle) * 7, Math.sin(angle) * 7, 11, "enemy", "bulletAimed", 0, { glowColor: "#ff1744", scaleMul: 1.3 })
      );
      this.laserShots++;
    }
    if (this.laserShots >= this.laserTotalShots) this._endPattern();
  }

  _runRadial(bulletList) {
    const fromX = this.x + this.w / 2;
    const fromY = this.y + this.h / 2;
    const count = this.phase >= 3 ? 28 : 22;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      bulletList.push(new Bullet(fromX - 6, fromY, Math.cos(angle) * 4.2, Math.sin(angle) * 4.2, 12, "enemy", "bulletAimed"));
    }
    this._endPattern();
  }

  _runSpiral(dt, bulletList) {
    this.spiralTick += dt;
    if (this.spiralTick >= 70) {
      this.spiralTick = 0;
      const fromX = this.x + this.w / 2;
      const fromY = this.y + this.h / 2;
      for (let i = 0; i < this.spiralArms; i++) {
        const angle = this.spiralAngle + (Math.PI * 2 * i) / this.spiralArms;
        bulletList.push(
          new Bullet(fromX - 6, fromY, Math.cos(angle) * 3.6, Math.sin(angle) * 3.6, 10, "enemy", "bulletAimed", 0, { glowColor: "#b388ff" })
        );
      }
      this.spiralAngle += 0.28;
      this.spiralTicks++;
    }
    if (this.spiralTicks >= this.spiralTotalTicks) this._endPattern();
  }

  _runMeteor(dt, bulletList) {
    this.meteorTimer += dt;
    if (!this.meteorSpawned && this.meteorTimer > 120) {
      this.meteorSpawned = true;
      for (const x of this.meteorCols || []) {
        bulletList.push(
          new Bullet(x - 8, -40, 0, 8.5, 20, "enemy", "enemyBulletStraight", 0, { glowColor: "#ff7043", scaleMul: 1.6 })
        );
      }
    }
    if (this.meteorTimer > 500) this._endPattern();
  }

  _runDash(dt) {
    const f = dt / 16.67;
    const speed = 6.5 + (this.phase - 1) * 0.9;
    if (this.dashPhase === "in") {
      const dx = this.dashTargetX - this.x;
      const dy = this.dashTargetY - this.y;
      const dist = Math.hypot(dx, dy);
      if (dist < speed * f) {
        this.x = this.dashTargetX;
        this.y = this.dashTargetY;
        this.dashPhase = "hold";
        this.dashHoldTimer = 200;
      } else {
        this.x += (dx / dist) * speed * f;
        this.y += (dy / dist) * speed * f;
      }
    } else if (this.dashPhase === "hold") {
      this.dashHoldTimer -= dt;
      if (this.dashHoldTimer <= 0) this.dashPhase = "out";
    } else {
      const dx = this.homeX - this.x;
      const dy = this.targetY - this.y;
      const dist = Math.hypot(dx, dy);
      if (dist < speed * f) {
        this.x = this.homeX;
        this.y = this.targetY;
        this.dashing = false;
        this._endPattern();
      } else {
        this.x += (dx / dist) * speed * f;
        this.y += (dy / dist) * speed * f;
      }
    }
  }

  _endPattern() {
    const finished = this.pattern;
    if (finished === "meteor") this.meteorCols = null;
    if (finished === "laser") this.laserAngle = undefined;
    const mult = PHASE_COOLDOWN_MULT[this.phase] || 1;
    this.cooldowns[finished] = Math.round((PATTERN_COOLDOWN_BASE[finished] || 5000) * mult);
    this.pattern = null;

    if (this.phase === 3 && !this.comboActive) {
      const partner = (COMBO_PAIRS[this.stageNum] || {})[finished];
      if (partner && (PATTERN_MIN_PHASE[partner] || 1) <= this.phase) {
        this.comboActive = true;
        const ctx = this._ctx || {};
        this._launchPattern(partner, ctx.player, ctx.bulletList, ctx.particles);
        return;
      }
    }
    this.comboActive = false;
  }

  takeDamage(dmg) {
    this.hp -= dmg;
    if (this.hp <= 0) this.dead = true;
  }

  draw(ctx) {
    const img = images[this.imgKey];
    ctx.save();
    if (this.phase === 3) {
      ctx.shadowColor = this.stageNum === 5 ? "#8e24aa" : "#c62828";
      ctx.shadowBlur = 20 + Math.sin(this.t / 110) * 8;
    } else if (this.phase === 2) {
      ctx.shadowColor = "#ff9800";
      ctx.shadowBlur = 10;
    }
    if (img) ctx.drawImage(img, this.x, this.y, this.w, this.h);
    ctx.restore();

    if (this.pattern === "laser") {
      const p = this.laserShots / this.laserTotalShots;
      const angle = this.laserSweepFrom + (this.laserSweepTo - this.laserSweepFrom) * p;
      const fromX = this.x + this.w / 2;
      const fromY = this.y + this.h - 10;
      ctx.save();
      ctx.strokeStyle = "rgba(255,23,68,0.5)";
      ctx.lineWidth = 16;
      ctx.shadowColor = "#ff1744";
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.moveTo(fromX, fromY);
      ctx.lineTo(fromX + Math.cos(angle) * 720, fromY + Math.sin(angle) * 720);
      ctx.stroke();
      ctx.restore();
    }

    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(20, 20, CONFIG.WIDTH - 40, 12);
    ctx.fillStyle = this.phase === 3 ? "#8e24aa" : this.phase === 2 ? "#e53935" : this.stageNum === 5 ? "#c62828" : "#ff9800";
    ctx.fillRect(20, 20, (CONFIG.WIDTH - 40) * Math.max(0, this.hp / this.maxHp), 12);
  }
}

export class BossEcho extends Boss {
  constructor(stageNum) {
    super(stageNum);
    this.isEcho = true;
    this.w = 96;
    this.h = 96;
    this.x = CONFIG.WIDTH / 2 - this.w / 2;
    this.y = -this.h;
    this.targetY = 90 + Math.random() * 80;
    this.maxHp = Math.round(this.maxHp * ECHO_HP_FRACTION);
    this.hp = this.maxHp;
    if (PATTERN_KIT_STAGES.has(stageNum)) this.homeX = this.x;
  }

  draw(ctx) {
    const img = images[this.imgKey];
    if (img) ctx.drawImage(img, this.x, this.y, this.w, this.h);
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(this.x, this.y - 10, this.w, 6);
    ctx.fillStyle = "#c62828";
    ctx.fillRect(this.x, this.y - 10, this.w * Math.max(0, this.hp / this.maxHp), 6);
  }
}
