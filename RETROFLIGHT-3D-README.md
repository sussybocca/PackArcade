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
