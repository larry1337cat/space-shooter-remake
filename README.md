# Space Shooter Remake

A bullet-hell space shooter with a pixel-art style, built in pure JavaScript and rendered on HTML5 Canvas. Pilot your ship through 5 stages, dodging bullets, farming gold, upgrading your ship, and fighting bosses with a phase-based skill system.

---

## Gameplay

- Pilot your ship to dodge bullets and destroy enemies across designed waves.
- Collect gold, health pickups, and orbs dropped by defeated enemies.
- Spend gold to upgrade your ship on the **Upgrade** screen between runs.
- Clear every regular wave in a stage to face its **Boss**.

## Stages

| Stage | Name | Characteristics |
|---|---|---|
| 1 | Outer Belt | Introductory enemy formations |
| 2 | Contested Zone | Mixed enemy types, increasing pressure |
| 3 | Void Core | Introduces the named boss skill system |
| 4 | The Abyss | Boss chains 2 skills back-to-back with no downtime |
| 5 | Bloodsoaked Planet | Final boss, highest health pool, uses the full 11-skill kit |

## Boss System

Starting from Stage 3, bosses use a named skill kit instead of simple bullet fire. Each skill has its own cooldown, phase-based unlock conditions, and attack pattern:

- **Chain Ring, Bullet Rain**: dense bullet storms covering the screen
- **Orb Barrage, Orb Nova**: orb barrages that explode outward
- **Planet Summon, Explosion Field**: summons and wide-area blast fields
- **Dash**: a direct charge attack with contact damage
- **Radial, Spiral, Homing**: circular spread shots, spiral patterns, homing bullets
- **Meteor, Shockwave**: falling meteors and shockwave blasts
- **Planet Ultimate**: triggered when the boss is near death

**Phase system:**
- Bosses shift phases at 100% to 65% to 30% HP, with screen shake and a warning flash on transition.
- Skill cooldowns recover up to 45% faster in later phases.
- Below 30% HP (enrage), skills chain with no gap (e.g. Shockwave into Laser, Spiral into Homing, Meteor into Radial).
- The Stage 5 boss summons a **Boss Echo** (a miniature copy of a previous stage's boss) once its HP drops below 20%.

## Player Skills

Your ship has 3 unlockable active skills:

- **Shield**: temporary invincibility; cooldown shortens with upgrades
- **Overdrive**: boosts attack power for a limited time
- **Pierce**: bullets pierce multiple targets; pierce count scales with level

A permanent gold-based upgrade system also covers Damage, Max Health, and Fire Rate.

## Tech Stack

- Pure JavaScript (ES Modules), HTML5 Canvas
- No external frameworks or libraries
- Service Worker support (offline play / PWA)
- Progress saved via `localStorage`
