import { CONFIG, KEYBINDS } from "./config.js";
import { images } from "./assetLoader.js";
import { Input } from "./input.js";
import * as AudioMgr from "./audio.js";
import { loadSave, writeSave } from "./save.js";
import { Player, Bullet, Pickup, spawnBurst, spawnSparks, Smoke, Enemy, BossEcho, ExplosionHazard } from "./entities.js";
import { STAGES, getStage, buildWaveEnemies } from "./waves.js";
import { Button, Slider, drawText, drawBar, drawSkillButton, wrapText } from "./ui.js";

const BUTTON_TEXT_COLOR = "#0e2433";
const MAX_PARTICLES = 260;

export const STATE = {
  MENU: "MENU",
  STAGE_SELECT: "STAGE_SELECT",
  PLAYING: "PLAYING",
  PAUSE: "PAUSE",
  UPGRADE: "UPGRADE",
  SETTINGS: "SETTINGS",
  CREDITS: "CREDITS",
  GAMEOVER: "GAMEOVER",
  WIN: "WIN",
};

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.input = new Input(canvas);
    this.save = loadSave();
    this.lastTime = performance.now();
    this.buttons = {};
    AudioMgr.initVolumes(this.save.settings);
    this._buildMenuButtons();
    AudioMgr.unlockAudioOnce();
    document.addEventListener("visibilitychange", () => {
      if (document.hidden && this.state === STATE.PLAYING) this.state = STATE.PAUSE;
    });
    this.goto(STATE.MENU);
  }

  _buildMenuButtons() {
    const w = CONFIG.WIDTH;
    this.buttons.menu = {
      start: new Button({ x: w / 2 - 110, y: 430, w: 220, h: 64, imgKey: "startButton", pressedImgKey: "startButtonPressed" }),
      upgrade: new Button({ x: w / 2 - 110, y: 510, w: 220, h: 56, label: "NÂNG CẤP", imgKey: "button", pressedImgKey: "buttonPressed", textColor: BUTTON_TEXT_COLOR }),
      settings: new Button({ x: w / 2 - 110, y: 580, w: 220, h: 56, label: "CÀI ĐẶT", imgKey: "button", pressedImgKey: "buttonPressed", textColor: BUTTON_TEXT_COLOR }),
      credits: new Button({ x: w / 2 - 110, y: 650, w: 220, h: 56, label: "CREDITS", imgKey: "button", pressedImgKey: "buttonPressed", textColor: BUTTON_TEXT_COLOR }),
      mute: new Button({ x: w - 60, y: 20, w: 40, h: 40, label: "🔊", imgKey: null }),
    };
    this.buttons.back = new Button({ x: 16, y: 16, w: 90, h: 44, label: "QUAY LẠI", imgKey: "button", pressedImgKey: "buttonPressed", fontSize: 16, textColor: BUTTON_TEXT_COLOR });

    this.buttons.pauseIcon = new Button({ x: w - 46, y: 6, w: 34, h: 28, label: "❚❚", imgKey: null, fontSize: 16 });
    this.buttons.pause = {
      resume: new Button({ x: w / 2 - 110, y: 340, w: 220, h: 60, label: "TIẾP TỤC", imgKey: "button", pressedImgKey: "buttonPressed", textColor: BUTTON_TEXT_COLOR }),
      mute: new Button({ x: w / 2 - 110, y: 410, w: 220, h: 56, label: "🔊", imgKey: "button", pressedImgKey: "buttonPressed", textColor: BUTTON_TEXT_COLOR }),
      menu: new Button({ x: w / 2 - 110, y: 480, w: 220, h: 56, label: "VỀ MENU", imgKey: "button", pressedImgKey: "buttonPressed", textColor: BUTTON_TEXT_COLOR }),
    };

    this.buttons.godMode = new Button({ x: w / 2 - 140, y: 440, w: 280, h: 56, imgKey: "button", pressedImgKey: "buttonPressed", fontSize: 15, textColor: BUTTON_TEXT_COLOR });

    this.sliders = {
      music: new Slider({
        x: w / 2 - 140,
        y: 260,
        w: 280,
        value: this.save.settings.musicVolume,
        onChange: (v) => AudioMgr.setMusicVolume(v),
        onRelease: (v) => {
          this.save.settings.musicVolume = v;
          writeSave(this.save);
        },
      }),
      sfx: new Slider({
        x: w / 2 - 140,
        y: 360,
        w: 280,
        value: this.save.settings.sfxVolume,
        onChange: (v) => AudioMgr.setSfxVolume(v),
        onRelease: (v) => {
          this.save.settings.sfxVolume = v;
          writeSave(this.save);
          AudioMgr.playSfx("click");
        },
      }),
    };

    const stageTopY = 150;
    const stageBoxW = 300;
    const stageBoxH = 260;
    const stageGap = 26;
    const stageStep = stageBoxH + stageGap;
    this.stageListBounds = { top: stageTopY, bottom: CONFIG.HEIGHT - 40 };
    this.stageScrollY = 0;
    this.stageMaxScroll = Math.max(0, STAGES.length * stageStep - stageGap - (this.stageListBounds.bottom - this.stageListBounds.top));
    this._stageDragAmount = 0;
    this._stagePointerWasDown = false;
    this._stagePressIndex = -1;
    this.buttons.stageSelect = STAGES.map((s, i) => {
      const btn = new Button({
        x: w / 2 - stageBoxW / 2,
        y: stageTopY + i * stageStep,
        w: stageBoxW,
        h: stageBoxH,
        label: s.name,
        imgKey: "stage" + s.id,
        fontSize: 16,
        imgFit: "contain",
      });
      btn.baseY = btn.y;
      return btn;
    });

    this.buttons.upgrade = {
      damage: new Button({ x: w / 2 - 150, y: 165, w: 300, h: 70, imgKey: "button" }),
      health: new Button({ x: w / 2 - 150, y: 245, w: 300, h: 70, imgKey: "button" }),
      fireRate: new Button({ x: w / 2 - 150, y: 325, w: 300, h: 70, imgKey: "button" }),
      shieldCooldown: new Button({ x: w / 2 - 150, y: 405, w: 300, h: 70, imgKey: "button" }),
      unlockOverdrive: new Button({ x: w / 2 - 150, y: 485, w: 300, h: 70, imgKey: "button" }),
      overdriveLevel: new Button({ x: w / 2 - 150, y: 565, w: 300, h: 70, imgKey: "button" }),
      pierceLevel: new Button({ x: w / 2 - 150, y: 645, w: 300, h: 70, imgKey: "button" }),
    };

    this.buttons.gameover = {
      retry: new Button({ x: w / 2 - 110, y: 460, w: 220, h: 60, label: "THỬ LẠI", imgKey: "button", pressedImgKey: "buttonPressed", textColor: BUTTON_TEXT_COLOR }),
      menu: new Button({ x: w / 2 - 110, y: 530, w: 220, h: 56, label: "VỀ MENU", imgKey: "button", pressedImgKey: "buttonPressed", textColor: BUTTON_TEXT_COLOR }),
    };

    this.buttons.win = {
      menu: new Button({ x: w / 2 - 110, y: 600, w: 220, h: 60, label: "VỀ MENU", imgKey: "button", pressedImgKey: "buttonPressed", textColor: BUTTON_TEXT_COLOR }),
    };
  }

  goto(state) {
    this.state = state;
    if (state === STATE.MENU) AudioMgr.playTrack("menu");
  }

  startStage(stageId) {
    this.currentStage = stageId;
    this.waveIndex = 0;
    this.player = new Player(this.save.settings.godMode ? this._godModeStats() : this.save);
    this.bullets = [];
    this.enemies = [];
    this.boss = null;
    this.pickups = [];
    this.particles = [];
    this.hazards = [];
    this.bgScroll = 0;
    this.stageCurrencyEarned = 0;
    this.shakeMag = 0;
    this.flashTimer = 0;
    this.flashDuration = 1;
    this.flashColor = "rgba(255,255,255,0.3)";
    this._spawnWave();
    this.state = STATE.PLAYING;
    AudioMgr.playTrack(getStage(stageId).musicKey);
  }

  _spawnWave() {
    const { enemies, boss } = buildWaveEnemies(this.currentStage, this.waveIndex);
    this.enemies = enemies;
    this.boss = boss;
    if (boss) AudioMgr.playTrack("boss");
  }

  _advanceWave() {
    const stage = getStage(this.currentStage);
    this.waveIndex++;
    if (this.waveIndex >= stage.waves.length) {
      this._onStageClear();
    } else {
      this._spawnWave();
    }
  }

  _onStageClear() {
    this.save.currency += this.stageCurrencyEarned;
    if (this.currentStage >= this.save.stageUnlocked && this.currentStage < STAGES.length) {
      this.save.stageUnlocked = this.currentStage + 1;
    }
    writeSave(this.save);
    if (this.currentStage >= STAGES.length) {
      this.state = STATE.WIN;
      AudioMgr.playTrack("win");
    } else {
      this.state = STATE.STAGE_SELECT;
      AudioMgr.playTrack("menu");
    }
  }

  _godModeStats() {
    return {
      upgrades: { damage: 50, maxHealth: 1000, fireRate: 10, shieldCooldown: 6, overdrive: 6, pierce: 6 },
      skillUnlocked: { shield: true, overdrive: true, pierce: true },
    };
  }

  _onPlayerDied() {
    this.save.currency += Math.floor(this.stageCurrencyEarned * 0.5);
    writeSave(this.save);
    this.state = STATE.GAMEOVER;
    AudioMgr.playTrack("menu");
  }

  loop = (now) => {
    const dt = Math.min(50, now - this.lastTime);
    this.lastTime = now;
    this.update(dt);
    this.draw();
    this.input.endFrame();
    requestAnimationFrame(this.loop);
  };

  update(dt) {
    switch (this.state) {
      case STATE.MENU:
        this._updateMenu(dt);
        break;
      case STATE.STAGE_SELECT:
        this._updateStageSelect(dt);
        break;
      case STATE.PLAYING:
        this._updatePlaying(dt);
        break;
      case STATE.PAUSE:
        this._updatePause(dt);
        break;
      case STATE.UPGRADE:
        this._updateUpgrade(dt);
        break;
      case STATE.SETTINGS:
        this._updateSettings(dt);
        break;
      case STATE.CREDITS:
        this._updateCredits(dt);
        break;
      case STATE.GAMEOVER:
        this._updateGameover(dt);
        break;
      case STATE.WIN:
        this._updateWin(dt);
        break;
    }
  }

  _updateMenu(dt) {
    const b = this.buttons.menu;
    b.mute.label = AudioMgr.isMuted() ? "🔇" : "🔊";
    Object.values(b).forEach((btn) => btn.update(dt));
    if (b.start.handle(this.input)) this.goto(STATE.STAGE_SELECT);
    if (b.upgrade.handle(this.input)) this.goto(STATE.UPGRADE);
    if (b.settings.handle(this.input)) this.goto(STATE.SETTINGS);
    if (b.credits.handle(this.input)) this.goto(STATE.CREDITS);
    if (b.mute.handle(this.input)) this._toggleMute();
  }

  _toggleMute() {
    AudioMgr.setMuted(!AudioMgr.isMuted());
    this.save.settings.muted = AudioMgr.isMuted();
    writeSave(this.save);
  }

  _updateSettings(dt) {
    this.buttons.back.update(dt);
    if (this.buttons.back.handle(this.input)) return this.goto(STATE.MENU);
    this.sliders.music.handle(this.input);
    this.sliders.sfx.handle(this.input);
    this.buttons.godMode.update(dt);
    if (this.buttons.godMode.handle(this.input)) {
      this.save.settings.godMode = !this.save.settings.godMode;
      writeSave(this.save);
    }
  }

  _updateStageSelect(dt) {
    this.buttons.back.update(dt);
    if (this.buttons.back.handle(this.input)) return this.goto(STATE.MENU);

    const input = this.input;
    const bounds = this.stageListBounds;
    const wasDown = this._stagePointerWasDown;
    this._stagePointerWasDown = input.pointerDown;

    if (input.pointerDown && input.y >= bounds.top && input.y <= bounds.bottom) {
      this._stageDragAmount += Math.abs(input.dy);
      this.stageScrollY = Math.max(0, Math.min(this.stageMaxScroll, this.stageScrollY - input.dy));
    }

    const justPressed = input.pointerDown && !wasDown;
    const justReleased = !input.pointerDown && wasDown;
    if (justPressed) this._stagePressIndex = this._stageIndexAt(input.x, input.y, bounds);

    this.buttons.stageSelect.forEach((btn, i) => {
      btn.y = btn.baseY - this.stageScrollY;
      btn.update(dt);
      btn.disabled = !this.save.settings.godMode && STAGES[i].id > this.save.stageUnlocked;
    });

    if (justReleased) {
      const idx = this._stagePressIndex;
      this._stagePressIndex = -1;
      if (idx >= 0 && this._stageDragAmount <= 12) {
        const btn = this.buttons.stageSelect[idx];
        if (!btn.disabled) {
          btn._pressedVisual = 120;
          AudioMgr.playSfx("click");
          this.startStage(STAGES[idx].id);
        }
      }
    }
    if (!input.pointerDown) this._stageDragAmount = 0;
  }

  _stageIndexAt(x, y, bounds) {
    if (y < bounds.top || y > bounds.bottom) return -1;
    for (let i = 0; i < this.buttons.stageSelect.length; i++) {
      const b = this.buttons.stageSelect[i];
      if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return i;
    }
    return -1;
  }

  _updatePlaying(dt) {
    this.buttons.pauseIcon.update(dt);
    if (this.buttons.pauseIcon.handle(this.input)) {
      this.state = STATE.PAUSE;
      return;
    }

    const stage = getStage(this.currentStage);
    this.bgScroll = (this.bgScroll + dt * 0.05) % CONFIG.HEIGHT;

    this.player.update(dt, this.input);
    if (this.player.tryFire(this.bullets)) AudioMgr.playSfx("shoot");

    if (this.player.smokeTimer <= 0) {
      this.player.smokeTimer = 55;
      const p = this.player.thrusterPoint();
      this.particles.push(new Smoke(p.x + (Math.random() * 10 - 5), p.y));
    }

    this.shakeMag *= 0.9;
    if (this.shakeMag < 0.05) this.shakeMag = 0;

    const shieldRect = { x: 20, y: CONFIG.HEIGHT - 90, w: 64, h: 64 };
    const pierceRect = { x: CONFIG.WIDTH / 2 - 32, y: CONFIG.HEIGHT - 90, w: 64, h: 64 };
    const odRect = { x: CONFIG.WIDTH - 84, y: CONFIG.HEIGHT - 90, w: 64, h: 64 };
    if (this.player.shieldUnlocked && (this.input.consumeTap(shieldRect) || this.input.consumeKey(KEYBINDS.shield))) this.player.activateShield();
    if (this.player.pierceUnlocked && (this.input.consumeTap(pierceRect) || this.input.consumeKey(KEYBINDS.pierce))) this.player.activatePierce();
    if (this.player.overdriveUnlocked && (this.input.consumeTap(odRect) || this.input.consumeKey(KEYBINDS.overdrive))) this.player.activateOverdrive();

    this.bullets.forEach((b) => b.update(dt, this.player));
    pruneDead(this.bullets);
    for (const b of this.bullets) {
      if (b.owner === "enemy" && b.glowColor && Math.random() < 0.45) {
        this.particles.push(...spawnSparks(b.x + b.w / 2, b.y + b.h / 2, 1, b.glowColor));
      }
    }

    this.particles.forEach((p) => p.update(dt));
    pruneDead(this.particles);

    if (this.flashTimer > 0) this.flashTimer -= dt;

    this.enemies.forEach((e) => {
      e.update(dt, this.player, this.bullets);
      if (e.isEcho) this._drainEchoQueues(e);
    });
    if (this.boss && !this.boss.dead) {
      this.boss.update(dt, this.player, this.bullets, this.enemies.length, this.particles);
      this._drainBossSummons();
      this._drainBossHazards();
      this._drainBossFx();
    }

    this.hazards.forEach((h) => h.update(dt));

    this._resolveCollisions();
    this._resolveHazardCollisions();

    pruneDead(this.hazards);

    this.pickups.forEach((p) => p.update(dt));
    pruneDead(this.pickups);

    pruneDead(this.enemies);
    capArray(this.particles, MAX_PARTICLES);

    if (this.player.health <= 0) {
      this._onPlayerDied();
      return;
    }

    const waveCleared = this.enemies.length === 0 && (!this.boss || this.boss.dead);
    if (waveCleared) this._advanceWave();
  }

  _resolveCollisions() {
    for (const bullet of this.bullets) {
      if (bullet.owner !== "player" || bullet.dead) continue;
      let resolvedThisFrame = false;
      for (const enemy of this.enemies) {
        if (enemy.dead || bullet.hitTargets.has(enemy)) continue;
        if (rectHit(bullet, enemy)) {
          enemy.takeDamage(bullet.damage);
          bullet.hitTargets.add(enemy);
          this.player.registerHit();
          this.particles.push(...spawnSparks(bullet.x + bullet.w / 2, bullet.y, 3, "#7ecbff"));
          bullet.registerHit();
          AudioMgr.playSfx("hit");
          if (enemy.dead) this._onEnemyKilled(enemy, !!enemy.isEcho);
          resolvedThisFrame = true;
          break;
        }
      }
      if (!resolvedThisFrame && this.boss && !this.boss.dead && !bullet.hitTargets.has(this.boss) && rectHit(bullet, this.boss)) {
        this.boss.takeDamage(bullet.damage);
        bullet.hitTargets.add(this.boss);
        this.player.registerHit();
        this.particles.push(...spawnSparks(bullet.x + bullet.w / 2, bullet.y, 4, "#ffca28"));
        bullet.registerHit();
        AudioMgr.playSfx("hit");
        this.triggerShake(3);
        if (this.boss.dead) this._onEnemyKilled(this.boss, true);
      }
    }

    for (const bullet of this.bullets) {
      if (bullet.owner !== "enemy" || bullet.dead) continue;
      if (rectHit(bullet, this.player)) {
        const hurt = this.player.takeDamage(bullet.damage);
        bullet.dead = true;
        if (hurt) {
          this.triggerShake(6);
          this.particles.push(...spawnSparks(this.player.x + this.player.w / 2, this.player.y + this.player.h / 2, 5, "#ff6b6b"));
          AudioMgr.playSfx("hurt");
        }
      }
    }

    for (const enemy of this.enemies) {
      if (enemy.dead || !enemy.def?.kamikaze) continue;
      if (rectHit(enemy, this.player)) {
        const hurt = this.player.takeDamage(enemy.def.contactDamage);
        enemy.dead = true;
        this.particles.push(...spawnBurst(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, { scale: 0.8, sparkCount: 6 }));
        if (hurt) {
          this.triggerShake(8);
          this.particles.push(...spawnSparks(this.player.x + this.player.w / 2, this.player.y + this.player.h / 2, 5, "#ff6b6b"));
          AudioMgr.playSfx("hurt");
        }
      }
    }

    if (this.boss && this.boss.dashing && !this.boss.dead && rectHit(this.boss, this.player)) {
      const hurt = this.player.takeDamage(this.boss.dashDamage);
      if (hurt) {
        this.triggerShake(10);
        this.particles.push(...spawnSparks(this.player.x + this.player.w / 2, this.player.y + this.player.h / 2, 6, "#ff6b6b"));
        AudioMgr.playSfx("hurt");
      }
    }

    for (const p of this.pickups) {
      if (p.dead) continue;
      if (rectHit(p, this.player)) {
        if (p.type === "medkit") {
          this.player.health = Math.min(this.player.maxHealth, this.player.health + 25);
        } else if (p.type === "money") {
          this.stageCurrencyEarned += 5;
        }
        p.dead = true;
        AudioMgr.playSfx("pickup");
      }
    }
  }

  _drainBossSummons() {
    if (!this.boss.summonQueue.length) return;
    for (const spec of this.boss.summonQueue) {
      if (spec.type === "echo") this.enemies.push(new BossEcho(spec.stage));
      else this.enemies.push(new Enemy(spec.enemyType, spec.x, spec.y));
    }
    this.boss.summonQueue.length = 0;
  }

  _drainBossHazards() {
    if (!this.boss.hazardQueue.length) return;
    for (const spec of this.boss.hazardQueue) {
      this.hazards.push(new ExplosionHazard(spec.x, spec.y, spec.radius, spec.damage));
    }
    this.boss.hazardQueue.length = 0;
  }

  _resolveHazardCollisions() {
    const px = this.player.x + this.player.w / 2;
    const py = this.player.y + this.player.h / 2;
    for (const hz of this.hazards) {
      if (hz.applied || !hz.isDangerous) continue;
      if (Math.hypot(px - hz.x, py - hz.y) < hz.radius + this.player.w * 0.3) {
        hz.applied = true;
        const hurt = this.player.takeDamage(hz.damage);
        if (hurt) {
          this.triggerShake(8);
          this.particles.push(...spawnSparks(px, py, 5, "#ff6b6b"));
          AudioMgr.playSfx("hurt");
        }
      }
    }
  }

  _drainEchoQueues(echo) {
    if (echo.summonQueue && echo.summonQueue.length) {
      for (const spec of echo.summonQueue) {
        if (spec.type === "echo") this.enemies.push(new BossEcho(spec.stage));
        else this.enemies.push(new Enemy(spec.enemyType, spec.x, spec.y));
      }
      echo.summonQueue.length = 0;
    }
    if (echo.hazardQueue && echo.hazardQueue.length) {
      for (const spec of echo.hazardQueue) {
        this.hazards.push(new ExplosionHazard(spec.x, spec.y, spec.radius, spec.damage));
      }
      echo.hazardQueue.length = 0;
    }
    if (echo.fxQueue && echo.fxQueue.length) {
      for (const fx of echo.fxQueue) {
        if (fx.type === "shake") this.triggerShake(fx.amount);
        else if (fx.type === "flash") {
          this.flashTimer = fx.duration;
          this.flashDuration = fx.duration;
          this.flashColor = fx.color;
        }
      }
      echo.fxQueue.length = 0;
    }
  }

  _drainBossFx() {
    if (!this.boss.fxQueue || !this.boss.fxQueue.length) return;
    for (const fx of this.boss.fxQueue) {
      if (fx.type === "shake") this.triggerShake(fx.amount);
      else if (fx.type === "flash") {
        this.flashTimer = fx.duration;
        this.flashDuration = fx.duration;
        this.flashColor = fx.color;
      }
    }
    this.boss.fxQueue.length = 0;
  }

  triggerShake(amount) {
    this.shakeMag = Math.max(this.shakeMag, amount);
  }

  _onEnemyKilled(enemy, isBoss = false) {
    const cx = enemy.x + enemy.w / 2;
    const cy = enemy.y + enemy.h / 2;
    this.particles.push(...spawnBurst(cx, cy, { scale: isBoss ? 2.6 : 1, sparkCount: isBoss ? 18 : 7 }));
    this.triggerShake(isBoss ? 14 : 4);
    AudioMgr.playSfx("explosion");

    const mult = this.player.comboMultiplier;
    const base = isBoss ? 100 : 8;
    this.stageCurrencyEarned += Math.round(base * mult);

    if (Math.random() < 0.12) {
      this.pickups.push(new Pickup(enemy.x + enemy.w / 2 - 14, enemy.y, "medkit"));
    } else if (Math.random() < 0.35 || isBoss) {
      this.pickups.push(new Pickup(enemy.x + enemy.w / 2 - 14, enemy.y, "money"));
    }
  }

  _updateUpgrade(dt) {
    this.buttons.back.update(dt);
    if (this.buttons.back.handle(this.input)) return this.goto(STATE.MENU);
    const costs = this._upgradeCosts();
    const b = this.buttons.upgrade;
    Object.values(b).forEach((btn) => btn.update(dt));

    if (b.damage.handle(this.input) && this.save.currency >= costs.damage) {
      this.save.currency -= costs.damage;
      this.save.upgrades.damage++;
      writeSave(this.save);
    }
    if (b.health.handle(this.input) && this.save.currency >= costs.health) {
      this.save.currency -= costs.health;
      this.save.upgrades.maxHealth++;
      writeSave(this.save);
    }
    if (b.fireRate.handle(this.input) && this.save.currency >= costs.fireRate && this.save.upgrades.fireRate < 8) {
      this.save.currency -= costs.fireRate;
      this.save.upgrades.fireRate++;
      writeSave(this.save);
    }
    if (b.shieldCooldown.handle(this.input) && this.save.currency >= costs.shieldCooldown && this.save.upgrades.shieldCooldown < 6) {
      this.save.currency -= costs.shieldCooldown;
      this.save.upgrades.shieldCooldown++;
      writeSave(this.save);
    }
    if (b.unlockOverdrive.handle(this.input) && !this.save.skillUnlocked.overdrive && this.save.currency >= 300) {
      this.save.currency -= 300;
      this.save.skillUnlocked.overdrive = true;
      writeSave(this.save);
    }

    b.overdriveLevel.disabled = !this.save.skillUnlocked.overdrive;
    if (b.overdriveLevel.handle(this.input) && this.save.currency >= costs.overdrive && this.save.upgrades.overdrive < 6) {
      this.save.currency -= costs.overdrive;
      this.save.upgrades.overdrive++;
      writeSave(this.save);
    }
    if (b.pierceLevel.handle(this.input) && this.save.currency >= costs.pierce && this.save.upgrades.pierce < 6) {
      this.save.currency -= costs.pierce;
      this.save.upgrades.pierce++;
      writeSave(this.save);
    }
  }

  _upgradeCosts() {
    return {
      damage: 40 + this.save.upgrades.damage * 25,
      health: 40 + this.save.upgrades.maxHealth * 25,
      fireRate: 60 + this.save.upgrades.fireRate * 35,
      shieldCooldown: 70 + this.save.upgrades.shieldCooldown * 45,
      overdrive: 90 + this.save.upgrades.overdrive * 55,
      pierce: 90 + this.save.upgrades.pierce * 55,
    };
  }

  _updateCredits(dt) {
    this.buttons.back.update(dt);
    if (this.buttons.back.handle(this.input)) this.goto(STATE.MENU);
  }

  _updateGameover(dt) {
    const b = this.buttons.gameover;
    Object.values(b).forEach((btn) => btn.update(dt));
    if (b.retry.handle(this.input)) this.startStage(this.currentStage);
    if (b.menu.handle(this.input)) this.goto(STATE.MENU);
  }

  _updateWin(dt) {
    const b = this.buttons.win;
    b.menu.update(dt);
    if (b.menu.handle(this.input)) this.goto(STATE.MENU);
  }

  _updatePause(dt) {
    const b = this.buttons.pause;
    Object.values(b).forEach((btn) => btn.update(dt));
    if (b.resume.handle(this.input)) this.state = STATE.PLAYING;
    if (b.mute.handle(this.input)) this._toggleMute();
    if (b.menu.handle(this.input)) this.goto(STATE.MENU);
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
    switch (this.state) {
      case STATE.MENU:
        this._drawMenu();
        break;
      case STATE.STAGE_SELECT:
        this._drawStageSelect();
        break;
      case STATE.PLAYING:
        this._drawPlaying();
        break;
      case STATE.PAUSE:
        this._drawPause();
        break;
      case STATE.UPGRADE:
        this._drawUpgrade();
        break;
      case STATE.SETTINGS:
        this._drawSettings();
        break;
      case STATE.CREDITS:
        this._drawCredits();
        break;
      case STATE.GAMEOVER:
        this._drawGameover();
        break;
      case STATE.WIN:
        this._drawWin();
        break;
    }
  }

  _drawBg(key) {
    const img = images[key];
    const ctx = this.ctx;
    if (img) {
      ctx.drawImage(img, 0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
    } else {
      ctx.fillStyle = "#0a0e1e";
      ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
    }
  }

  _drawMenu() {
    this._drawBg("bg");
    const ctx = this.ctx;
    drawText(ctx, "SPACE SHOOTER", CONFIG.WIDTH / 2, 200, { font: "PixelTitle", size: 40 });
    drawText(ctx, "REMAKE BY LARRY", CONFIG.WIDTH / 2, 240, { font: "PixelTitle", size: 20, color: "#8fa8ff" });
    Object.values(this.buttons.menu).forEach((b) => b.draw(ctx));
    drawText(ctx, "💰 " + this.save.currency, 60, 40, { size: 18, align: "left" });
  }

  _drawSettings() {
    this._drawBg("bg");
    const ctx = this.ctx;
    drawText(ctx, "CÀI ĐẶT", CONFIG.WIDTH / 2, 100, { font: "PixelTitle", size: 30 });

    drawText(ctx, "Nhạc nền", CONFIG.WIDTH / 2, 230, { size: 16, color: "#cde" });
    this.sliders.music.draw(ctx);

    drawText(ctx, "Hiệu ứng", CONFIG.WIDTH / 2, 330, { size: 16, color: "#cde" });
    this.sliders.sfx.draw(ctx);

    const godMode = this.save.settings.godMode;
    this.buttons.godMode.label = godMode ? "GOD MODE: BẬT" : "GOD MODE: TẮT";
    this.buttons.godMode.draw(ctx);
    drawText(ctx, "Máu Lv.1000, sát thương Lv.50, tốc bắn Lv.10, mở hết stage", CONFIG.WIDTH / 2, 500, { size: 11, color: "#9ac" });

    this.buttons.back.draw(ctx);
  }

  _drawStageSelect() {
    this._drawBg("bg");
    const ctx = this.ctx;
    drawText(ctx, "CHỌN STAGE", CONFIG.WIDTH / 2, 100, { font: "PixelTitle", size: 30 });

    const bounds = this.stageListBounds;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, bounds.top, CONFIG.WIDTH, bounds.bottom - bounds.top);
    ctx.clip();
    this.buttons.stageSelect.forEach((b) => b.draw(ctx));
    ctx.restore();

    if (this.stageMaxScroll > 0 && this.stageScrollY < this.stageMaxScroll - 2) {
      drawText(ctx, "▼", CONFIG.WIDTH / 2, bounds.bottom + 18, { size: 16, color: "#7aa2ff" });
    }

    this.buttons.back.draw(ctx);
  }

  _drawPlaying() {
    this._drawPlayingScene(true);
    this.buttons.pauseIcon.draw(this.ctx);
  }

  _drawPause() {
    this._drawPlayingScene(false);
    const ctx = this.ctx;
    ctx.fillStyle = "rgba(5,6,13,0.75)";
    ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);

    drawText(ctx, "TẠM DỪNG", CONFIG.WIDTH / 2, 260, { font: "PixelTitle", size: 32 });
    const b = this.buttons.pause;
    b.mute.label = AudioMgr.isMuted() ? "🔇 NHẠC: TẮT" : "🔊 NHẠC: BẬT";
    Object.values(b).forEach((btn) => btn.draw(ctx));
  }

  _drawPlayingScene(applyShake) {
    const stage = getStage(this.currentStage);
    const ctx = this.ctx;

    ctx.save();
    if (applyShake && this.shakeMag > 0) {
      const ox = (Math.random() * 2 - 1) * this.shakeMag;
      const oy = (Math.random() * 2 - 1) * this.shakeMag;
      ctx.translate(ox, oy);
    }

    this._drawBg(stage.bgKey);
    this.enemies.forEach((e) => e.draw(ctx));
    this.bullets.forEach((b) => b.draw(ctx));
    if (this.boss && !this.boss.dead) this.boss.draw(ctx);
    this.pickups.forEach((p) => p.draw(ctx));
    this.player.draw(ctx);
    this.particles.forEach((p) => p.draw(ctx));
    this.hazards.forEach((h) => h.draw(ctx));
    ctx.restore();

    if (this.flashTimer > 0) {
      const p = this.flashTimer / this.flashDuration;
      ctx.save();
      ctx.globalAlpha = p;
      ctx.fillStyle = this.flashColor;
      ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
      ctx.restore();
    }

    drawText(ctx, stage.name + " — Wave " + (this.waveIndex + 1) + "/" + stage.waves.length, CONFIG.WIDTH / 2, 20, { size: 13, color: "#cde" });
    if (this.save.settings.godMode) {
      drawText(ctx, "GOD MODE", CONFIG.WIDTH - 20, 8, { size: 11, color: "#ffca28", align: "right" });
    }
    drawBar(ctx, 20, 34, 160, 14, this.player.health / this.player.maxHealth, { fg: "#e53935" });
    drawText(ctx, "HP", 100, 41, { size: 10 });
    drawText(ctx, "💰 " + this.stageCurrencyEarned, CONFIG.WIDTH - 20, 40, { size: 14, align: "right" });

    if (this.player.comboCount >= 5) {
      const hot = this.player.comboCount >= 20 ? "#ff5252" : this.player.comboCount >= 10 ? "#ffca28" : "#7aa2ff";
      drawText(ctx, `COMBO x${this.player.comboCount}  (+${Math.round((this.player.comboMultiplier - 1) * 100)}% 💰)`, CONFIG.WIDTH / 2, 60, { size: 14, color: hot });
    }

    if (this.player.shieldUnlocked) {
      drawSkillButton(ctx, 20, CONFIG.HEIGHT - 90, 64, "skillIcon1", this.player.shieldState, this.player.shieldActive > 0 ? 1 - this.player.shieldActive / this.player.shieldDuration : this.player.shieldCooldown / this.player.shieldCooldownMax);
    }
    if (this.player.pierceUnlocked) {
      drawSkillButton(ctx, CONFIG.WIDTH / 2 - 32, CONFIG.HEIGHT - 90, 64, "skillButton3", this.player.pierceState, this.player.pierceActive > 0 ? 1 - this.player.pierceActive / this.player.pierceDuration : this.player.pierceCooldown / this.player.pierceCooldownMax);
    }
    if (this.player.overdriveUnlocked) {
      drawSkillButton(ctx, CONFIG.WIDTH - 84, CONFIG.HEIGHT - 90, 64, "skillIcon2", this.player.overdriveState, this.player.overdriveActive > 0 ? 1 - this.player.overdriveActive / this.player.overdriveDuration : this.player.overdriveCooldown / this.player.overdriveCooldownMax);
    }
  }

  _drawUpgrade() {
    this._drawBg("bg");
    const ctx = this.ctx;
    drawText(ctx, "NÂNG CẤP", CONFIG.WIDTH / 2, 90, { font: "PixelTitle", size: 30 });
    drawText(ctx, "💰 " + this.save.currency, CONFIG.WIDTH / 2, 130, { size: 18 });

    const costs = this._upgradeCosts();
    const b = this.buttons.upgrade;
    b.damage.draw(ctx);
    drawText(ctx, `Sát thương +2  (Lv.${this.save.upgrades.damage})  —  ${costs.damage}💰`, CONFIG.WIDTH / 2, b.damage.y + b.damage.h / 2, { size: 14, color: BUTTON_TEXT_COLOR });

    b.health.draw(ctx);
    drawText(ctx, `Máu tối đa +20  (Lv.${this.save.upgrades.maxHealth})  —  ${costs.health}💰`, CONFIG.WIDTH / 2, b.health.y + b.health.h / 2, { size: 14, color: BUTTON_TEXT_COLOR });

    b.fireRate.draw(ctx);
    const frLabel = this.save.upgrades.fireRate >= 8 ? "MAX" : costs.fireRate + "💰";
    drawText(ctx, `Tốc độ bắn +  (Lv.${this.save.upgrades.fireRate}/8)  —  ${frLabel}`, CONFIG.WIDTH / 2, b.fireRate.y + b.fireRate.h / 2, { size: 14, color: BUTTON_TEXT_COLOR });

    b.shieldCooldown.draw(ctx);
    const scLabel = this.save.upgrades.shieldCooldown >= 6 ? "MAX" : costs.shieldCooldown + "💰";
    drawText(ctx, `Khiên: Hồi chiêu -0.5s  (Lv.${this.save.upgrades.shieldCooldown}/6)  —  ${scLabel}`, CONFIG.WIDTH / 2, b.shieldCooldown.y + b.shieldCooldown.h / 2, { size: 14, color: BUTTON_TEXT_COLOR });

    b.unlockOverdrive.draw(ctx);
    const odLabel = this.save.skillUnlocked.overdrive ? "ĐÃ MỞ KHÓA" : "300💰";
    drawText(ctx, `Kỹ năng: Overdrive  —  ${odLabel}`, CONFIG.WIDTH / 2, b.unlockOverdrive.y + b.unlockOverdrive.h / 2, { size: 14, color: BUTTON_TEXT_COLOR });

    b.overdriveLevel.draw(ctx);
    const odLvLabel = !this.save.skillUnlocked.overdrive ? "CẦN MỞ KHÓA" : this.save.upgrades.overdrive >= 6 ? "MAX" : costs.overdrive + "💰";
    drawText(ctx, `Overdrive: Hồi chiêu -0.75s, Thời gian +0.3s  (Lv.${this.save.upgrades.overdrive}/6)  —  ${odLvLabel}`, CONFIG.WIDTH / 2, b.overdriveLevel.y + b.overdriveLevel.h / 2, { size: 13, color: BUTTON_TEXT_COLOR });

    b.pierceLevel.draw(ctx);
    const pcLabel = this.save.upgrades.pierce >= 6 ? "MAX" : costs.pierce + "💰";
    drawText(ctx, `Xuyên phá: Hồi chiêu -0.5s, +1 hit/2Lv  (Lv.${this.save.upgrades.pierce}/6)  —  ${pcLabel}`, CONFIG.WIDTH / 2, b.pierceLevel.y + b.pierceLevel.h / 2, { size: 13, color: BUTTON_TEXT_COLOR });

    this.buttons.back.draw(ctx);
  }

  _drawCredits() {
    this._drawBg("bg");
    const ctx = this.ctx;
    const img = images.creditImage;
    if (img) {
      ctx.drawImage(img, 40, 100, CONFIG.WIDTH - 80, CONFIG.WIDTH - 80);
    }

    const maxWidth = CONFIG.WIDTH - 60;
    const para1 = "Nhằm tôn trọng tác giả và game gốc, mọi credit vẫn được giữ nguyên. Game đã được remake hoàn toàn từ Python sang JavaScript";
    const para2 = "Bản remake mang đến trải nghiệm mượt mà hơn đồng thời phát triển thêm stage 4 & 5 cũng như buff sức mạnh cho boss cùng nhiều update nhỏ!";

    const lines1 = wrapText(ctx, para1, maxWidth, "15px PixelTitle");
    const lines2 = wrapText(ctx, para2, maxWidth, "14px PixelBody");

    let y = 520;
    for (const line of lines1) {
      drawText(ctx, line, CONFIG.WIDTH / 2, y, { font: "PixelTitle", size: 15 });
      y += 20;
    }
    y += 12;
    for (const line of lines2) {
      drawText(ctx, line, CONFIG.WIDTH / 2, y, { size: 14, color: "#9ac" });
      y += 18;
    }

    this.buttons.back.draw(ctx);
  }

  _drawGameover() {
    this._drawBg("bg");
    const ctx = this.ctx;
    drawText(ctx, "BẠN ĐÃ GỤC NGÃ", CONFIG.WIDTH / 2, 260, { font: "PixelTitle", size: 32, color: "#e53935" });
    drawText(ctx, "Nhặt được: " + this.stageCurrencyEarned + " 💰 (giữ lại 50%)", CONFIG.WIDTH / 2, 320, { size: 16 });
    Object.values(this.buttons.gameover).forEach((b) => b.draw(ctx));
  }

  _drawWin() {
    this._drawBg("bgStage5");
    const ctx = this.ctx;
    drawText(ctx, "CHIẾN THẮNG!", CONFIG.WIDTH / 2, 200, { font: "PixelTitle", size: 38, color: "#43a047" });
    drawText(ctx, "Bạn đã phá đảo Space Shooter remake by Larry", CONFIG.WIDTH / 2, 250, { size: 16 });
    this.buttons.win.menu.draw(ctx);
  }
}

function rectHit(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function pruneDead(list) {
  for (let i = list.length - 1; i >= 0; i--) {
    if (list[i].dead) list.splice(i, 1);
  }
}

function capArray(list, max) {
  const excess = list.length - max;
  if (excess > 0) list.splice(0, excess);
}
