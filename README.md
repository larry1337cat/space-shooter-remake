# Space Shooter Remake

A bullet-hell space shooter with a pixel-art style, built in pure JavaScript and rendered on HTML5 Canvas. 5 stages, boss fights, upgrades between runs.

---

## Gameplay

- Pilot your ship to dodge bullets and destroy enemies wave by wave.
- Collect gold, health pickups, and orbs dropped by defeated enemies.
- Spend gold to upgrade your ship on the **Upgrade** screen between runs.
- Clear every regular wave in a stage to face its **Boss**.

## Stages

| Stage | Name | Characteristics |
|---|---|---|
| 1 | Outer Belt | Learn the ropes — basic formations, forgiving pace |
| 2 | Contested Zone | Mixed enemy types, pressure starts building |
| 3 | Void Core | Bosses start using the named skill system |
| 4 | The Abyss | Boss attacks back-to-back with zero breathing room |
| 5 | Bloodsoaked Planet | Final boss — highest health pool, full 11-skill kit |

## Boss System

Starting from Stage 3, bosses use a named skill kit instead of simple bullet fire. Each skill has its own cooldown, phase-based unlock conditions, and attack pattern:

- **Chain Ring, Bullet Rain**: dense bullet storms blanketing the screen
- **Orb Barrage, Orb Nova**: orb volleys that explode outward on contact
- **Planet Summon, Explosion Field**: summons and wide-area blasts
- **Dash**: direct charge, deals contact damage
- **Radial, Spiral, Homing**: spread shots, spiral patterns, homing bullets
- **Meteor, Shockwave**: falling meteors and shockwave blasts
- **Planet Ultimate**: triggers when the boss is near death

**Phase system:**
- Bosses shift phases at 100% → 65% → 30% HP, with screen shake and a warning flash on transition.
- Skill cooldowns recover up to 45% faster in later phases.
- Below 30% HP (enrage), skills chain with no gap — Shockwave into Laser, Spiral into Homing, Meteor into Radial.
- The Stage 5 boss summons a **Boss Echo** (a miniature copy of a previous stage's boss) once HP drops below 20%.

## Player Skills

Your ship has 3 unlockable active skills:

- **Shield**: temporary invincibility; cooldown shortens with upgrades
- **Overdrive**: boosts attack power for a limited time
- **Pierce**: bullets pierce multiple targets; pierce count scales with level

Damage, Max Health, and Fire Rate can also be upgraded permanently with gold.

## Tech Stack

- Pure JavaScript (ES Modules), HTML5 Canvas
- Service Worker support (offline play / PWA)
- Progress saved via `localStorage`
