# Space Shooter Remake

Bullet-hell space shooter, pixel-art style, built with vanilla JavaScript and rendered on HTML5 Canvas. 5 stages, boss fights, upgrades between runs.

## Gameplay

Pilot your ship, dodge bullets, clear enemies wave by wave. Enemies drop gold, health pickups, and orbs. Spend gold on the Upgrade screen between runs. Clear all regular waves in a stage before the boss shows up.

## Stages

1. **Outer Belt** – basic enemy formations, easy pace to learn the controls
2. **Contested Zone** – enemy variety picks up, difficulty starts ramping
3. **Void Core** – bosses start using the named skill system
4. **The Abyss** – boss attacks chain back to back, barely any downtime
5. **Bloodsoaked Planet** – final boss, highest HP, full 11-skill kit

## Boss system

Starting stage 3, bosses stop using plain bullet fire and switch to a named skill kit. Each skill has its own cooldown, phase-gated unlock condition, and attack pattern:

- Chain Ring, Bullet Rain – dense bullet spam covering the screen
- Orb Barrage, Orb Nova – orb volleys that explode on contact
- Planet Summon, Explosion Field – summons + wide-area blasts
- Dash – charges straight at the player, contact damage
- Radial, Spiral, Homing – spread shots, spiral patterns, homing bullets
- Meteor, Shockwave – falling meteors, shockwave blasts
- Planet Ultimate – triggers when the boss is near death

Bosses shift phases at 100% → 65% → 30% HP, with screen shake and a warning flash on transition. Cooldowns recover up to 45% faster in later phases. Below 30% HP (enrage), skills chain with basically no gap — Shockwave into Laser, Spiral into Homing, Meteor into Radial. The stage 5 boss also summons a Boss Echo (a miniature copy of an earlier boss) once it drops below 20% HP.

## Player skills

3 unlockable active skills:

- Shield – temporary invincibility, cooldown shortens with upgrades
- Overdrive – boosts attack power for a limited time
- Pierce – bullets pierce multiple targets, pierce count scales with level

Damage, Max Health, and Fire Rate can also be permanently upgraded with gold.

## Tech stack

Vanilla JavaScript (ES Modules), HTML5 Canvas, Service Worker support (offline play / PWA), progress saved via `localStorage`.
