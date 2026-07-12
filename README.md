# Space Shooter Remake

This is a bullet-hell space shooter with a pixel-art style, playable in the browser using pure JavaScript Canvas. Pilot your ship through 5 dangerous stages across the void, dodging bullets, farming gold, upgrading your power, and facing off against bosses with an incredibly diverse skill system.

⚠️ **Difficulty warning:** This is not a relaxing shoot 'em up. The game is designed to **push your reflexes and strategy to the limit** — the deeper you go, the more the bullet density and boss brutality scale exponentially, culminating in **Stage 5 — Bloodsoaked Planet**, the "super hard" mode where the final boss wields a massive health pool and the entire skill roster in the game.

---

## 🎮 Gameplay

- Pilot your ship to dodge bullets and destroy enemies across formation-designed waves.
- Collect gold, health pickups, and orbs dropped by defeated enemies.
- Spend gold to upgrade your ship on the **Upgrade** screen between runs.
- Clear every regular wave in a stage to face its **Boss**.

## 5 Stages

| Stage | Name | Characteristics |
|---|---|---|
| 1 | Outer Belt | Introductory, basic enemy formations |
| 2 | Contested Zone | Multiple enemy types mixed in, pressure ramps up |
| 3 | Void Core | Unlocks the **named boss skill pattern system** |
| 4 | The Abyss | Boss chains 2 skills back-to-back with no downtime |
| 5 | **Bloodsoaked Planet** | **Super hard mode** — final boss, massive health, uses the full 11-skill kit |

## Overpowered Boss System

Starting from Stage 3, bosses no longer fire simple bullets — they wield a **named skill kit**, where each skill has its own cooldown, phase-based unlock conditions, and unique attack mechanics:

- **Chain Ring, Bullet Rain**: dense bullet storms covering the whole screen
- **Orb Barrage, Orb Nova**: swirling orb barrages that explode outward
- **Planet Summon, Explosion Field**: summons and wide-area blast fields
- **Dash**: a direct charge attack dealing contact damage
- **Radial, Spiral, Homing**: circular spread shots, spiral patterns, and homing bullets
- **Meteor, Shockwave**: falling meteors and shockwave blasts
- **Planet Ultimate**: the ultimate move, only triggered when the boss is nearly out of health

**Phase System:**
- Bosses shift phases based on remaining HP % (100% → 65% → 30%), with screen shake and a warning flash on every transition.
- The later the phase, the faster skill cooldowns recover (up to 45% faster).
- In the final phase (enrage, <30% HP), the most dangerous skills **chain together with no gap** — for example Shockwave into Laser, Spiral into Homing, Meteor into Radial.
- The Stage 5 boss has a special mechanic: it summons a **Boss Echo** (a miniature copy of a previous stage's boss) once its HP drops below 20%.

## Player Skills

Your ship can unlock and upgrade 3 active skills to help you survive:

- 🛡️ **Shield** — temporary invincibility, cooldown shortens with upgrades
- 🔥 **Overdrive** — boosts attack power for a limited time
- 🎯 **Pierce** — bullets pierce through multiple targets at once, pierce count increases with level

There's also a permanent gold-based upgrade system covering **Damage, Max Health, Fire Rate**, and individual levels for each active skill.

## Tech Stack

- Pure JavaScript (ES Modules), rendered with HTML5 Canvas
- No external frameworks or libraries
- Service Worker support (offline play / PWA)
- Progress saved via `localStorage`
