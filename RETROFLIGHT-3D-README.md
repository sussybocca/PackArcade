# SpaceShooters 2 — RETROFLIGHT 3D (development preview)

This branch contains a new 3D game experience inside `public/imagine/SpaceShooters2/`, with the original edition preserved at `legacy-index.html` and all prior game assets and source files retained.

## Implemented

- Genuine Three.js 3D starships built from grouped, differentiated 3D geometry; layered cockpit glass, engines, wings, armor plates, lighting and articulated animations.
- 6DOF rigid-body movement using mass, inertia, thrust, yaw, pitch, roll, stabilization, velocity, optional gravity and impulse-based collision response.
- Three control presets: Authentic (no assist), Stabilized, Classic Arcade.
- Three camera modes: chase, cockpit and cinematic.
- Bosses and enemy variations with 3D targets, health bars, waves, predictive attacks and different maneuvering behavior.
- Single-shot fire with no recharge between presses; an independent heavy-volley attack with a 40-second cooldown. Heavy projectile count increases each 8 kills (maximum 16), with higher mass and damage.
- Three *persistent* upgrade choices after each round: Armor Plating (visible new plating and +20 max HP), Kinetic Pulse (+5 single-shot damage), Thruster Matrix (+main/side thrust and torque). Choose one per completed round; saved in browser localStorage without accounts.
- HUD: hull, shield, kills, wave, score, flight velocity and heavy cooldown; 3D combat effects, breakable/collectible power-ups, three reserve lives, local custom audio support, legacy original cheat codes.
- Dedicated desktop keyboard controls and touch-screen joystick + exactly two mobile weapon buttons, plus separate phone landscape/portrait and tablet layouts.
- Optional anonymous PeerJS rooms for host/join with enemy-state snapshots and remote shooting; local solo play requires no online account.
- Performance presets Auto, Low, Standard, Enhanced; accessible optional CRT mode.

## Controls

| Device | Input |
|---|---|
| Keyboard | W/S main thrust, A/D strafe, R/F vertical thrust, arrow keys yaw/pitch, Q/E roll |
| Keyboard weapons | Space: single shot; Shift: heavy salvo |
| Keyboard UI | P/Escape pause, C camera, H cheats |
| Mobile | Left virtual joystick for main thrust + steering, SINGLE tap for 1 immediate projectile, SALVO for heavy burst (40s cooldown) |

## Test instructions

```sh
node --test tests/retroflight.physics.test.cjs
python -m unittest discover -s tests -p 'retroflight_static.py' -v
python tests/retroflight_browser_smoke.py
```

The browser smoke suite requires Chromium and Python Playwright. It starts a local HTTP server, launches the game at desktop, phone, tablet and Chromebook viewports, and checks the joystick, both weapons, round upgrade persistence and the HUD. CI runs it using the bundled Three.js library.

## Local persistence

No account is required. Upgrade levels are saved under `retroflight-upgrades-v1` in localStorage and preferences under `retroflight-options-v1`; audio files can be stored in the existing IndexedDB `SpaceShootersDB`. Saved upgrades are specific to that browser and its storage partition. Clearing browser data erases them. Game view counting belongs to the enclosing PackArcade platform, not to the game itself.

## Dependencies and attribution

`vendor/three.min.js` is **Three.js r128**, MIT License, copyright 2010–2021 Three.js authors, obtained from the upstream official GitHub release tag. See `vendor/THREE-LICENSE.txt` for its original license. Optional multiplayer loads PeerJS 1.5.2 through a public CDN when the user requests hosting or joining a room. Existing user-authored and legacy SpaceShooters assets remain untouched, apart from fixing case-sensitive model paths and two missing legacy audio/video references.

## Release status

This is a **development preview**. Physics unit tests, static source tests, and scripted browser tests provide meaningful checks, but they cannot certify all multiplayer paths or every actual device/GPU/driver. Do not claim 90% acceptance until player, device, load, and multiplayer verification is performed. The previous version is recoverable from `legacy-index.html` and the original Git history.

## BRAINFLIGHT + HEAVYFLIGHT + GRAVITYCORE + TARGETLOCK 50 expansion

The new physics expansion lives on the dedicated \`packarcade-brainflight-gravitycore-2026-11-20\` review branch. It preserves the original 3D game systems, plus \`legacy-index.html\`.

- **BRAINFLIGHT** — eight AI pilot personalities with different reaction/flight tendencies, line-of-sight visibility, short-term target memory, obstacle avoidance, shared squad leader formation targets, local player-habit learning persisted as \`retroflight-brainflight-memory-v1\`, and physics-driven commands rather than position teleporting. No LLM or paid API.
- **HEAVYFLIGHT** — heavier player and enemy bodies, upgraded armor adding mass and inertia, damaged enemy engine efficiency, and the existing full 6DOF rigid body thruster simulation. Authentic, stabilized and arcade flight modes remain.
- **GRAVITYCORE** — multi-body inverse-square gravity on player, AI spacecraft, projectiles and space debris; different celestial fields by sector; collision impulses at planetary and moon surfaces; unbounded flight in gravitational sectors; gravity vector HUD. Non-gravity waves retain their arcade boundary.
- **TARGETLOCK 50** — separate manual crosshair, red bracket and green predicted lead marker. The aim direction blends 50% toward a visible target's predicted interception direction only within a narrow acquisition cone; no guaranteed hits. The assistance setting can be reduced from 50% to 0%.
- **Mobile two-joystick interface** — left stick controls forward/reverse thrust and strafe, double tap left to control vertical lift instead; right stick controls pitch and yaw to loop, double tap right for horizontal roll, or use a two-finger vertical drag on the right stick to lift/descent. Two existing action buttons remain SINGLE (one instant bullet per activation) and SALVO (kill-scaled heavy projectiles, 40-second cooldown). Joysticks have separate pointer capture and distinct portrait, landscape and tablet styling, including touch-enabled Chromebooks.
- **Original continuity** — retain local permanent armor, damage and thruster upgrades, enemy health bars, wave progression, original cheat codes, player HUD, music and custom audio, original 2D edition and optional PeerJS multiplayer.

### Verification

Run both original and new physics tests:

\`\`\`sh
node --test tests/retroflight.physics.test.cjs tests/retroflight.systems.test.cjs
python -m unittest discover -s tests -p retroflight_static.py -v
python tests/retroflight_browser_smoke.py
\`\`\`

GitHub Actions workflows \`.github/workflows/retroflight-3d-checks.yml\` and \`.github/workflows/brainflight-gravitycore.yml\` run physics, layout/static, and real browser smoke tests. Browser smoke exercises five viewport/device configurations, touch joystick pitch and roll/lift modes, single and heavy firing, cooldowns, saved upgrades, and reaching the gravitational sector.

**Acceptance caution:** Automated tests do not establish complete behavior on every real device, extended multiplayer sessions, all possible graphics drivers, or production server conditions. This branch is a reviewable development candidate, not a certified 90% completion declaration.
