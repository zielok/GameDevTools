# Particle Forge
A comprehensive 2D particle editor exported as a single, dependency-free HTML file. Designed for game developers building particle effects for Phaser, PixiJS, and similar engines.

## Features

### Emitters
- Multi-emitter system, each with independent physics, visuals, and timeline configuration
- Inline renaming and one-click cloning
- Configurable start delay per emitter
- Loop-synchronized burst timing

### Particle Engine
- Noise-based turbulence
- Global force fields: attractors and repulsors, with circle and rectangle influence shapes
- Sub-emitter system with two dependency modes:
  - **Trail** — spawns particles continuously along a parent particle's path
  - **Death Burst** — spawns particles when a parent particle expires
- Target emitters used as sub-emitter spawn templates suppress their own independent emission by default
- An emitter's "enabled" state is fully decoupled from its role as a sub-emitter template — disabling one doesn't disable the other

### Visuals
- 11 built-in particle shape types
- Animated spritesheet texture support
- Color randomization between two configurable colors
- Independent X and Y scale curves over particle lifetime

### Stage
- Configurable stage size with drag-to-resize handles
- Custom confirm modal for destructive actions (replaces blocked native browser dialogs)

### Export
- Spritesheet export
- ZIP export
- Aspect-ratio locking
- 1-bit alpha support for retro/pixel-art-style particles

## Usage

1. Open the HTML file in any modern browser
2. Add and configure one or more emitters
3. Tune physics, visuals, and timeline settings per emitter
4. Optionally link emitters via sub-emitter Trail or Death Burst behavior
5. Preview the effect on the stage
6. Export as a spritesheet or ZIP for use in your engine

## Technical Notes

- Single self-contained HTML file — no external libraries, no build step, no server required.
- Fixes and behavior changes have been verified with headless Chromium and pixel-level analysis rather than visual inspection alone, to catch subtle regressions in emission timing and particle state.

-------------------------------------

# Sprite Forge
A self-contained, browser-based tool for converting PNG animation frames into retro pixel art color palettes. No installation, no dependencies — just open the HTML file and start working.

## Features

### Input
- Load individual PNG frames or a ZIP archive containing an entire animation sequence

### Palette Selection
- Built-in retro palettes: DB32, DawnBringer 16, PICO-8, Sweetie 16, Endesga 32, C64, Game Boy (multiple variants), CGA, 1-bit
- Custom hex palette support
- Per-color toggling to include/exclude individual palette entries

### Color Matching
- Perceptual color matching in **OKLab** color space (default), with configurable lightness weighting for finer control over how brightness differences affect matching

### Dithering
- Ordered (Bayer) dithering at 2x2, 4x4, and 8x8 matrix sizes
- Checkerboard dithering
- Blue Noise dithering (void-and-cluster algorithm)
- Shadow/highlight-aware dithering
- Sobel edge protection to preserve sharp silhouettes
- Dither mask system that protects dithering patterns from being erased by artifact cleanup passes

### Artifact Cleanup
- Alpha edge decontamination
- Despeckle filtering
- Small island removal (8-connected flood fill, preserves diagonal 1px lines)
- Small hole filling

### Advanced Quantization
- Iterative relaxation quantizer using a 4-factor weighted scoring system: color similarity, lightness, neighbor coherence, and gradient direction
- Jacobi-style synchronous updates for stable, predictable convergence

### Export
- Manual ZIP export of processed frames (no auto-download — export is always an explicit user action)

## Usage

1. Open the HTML file in any modern browser
2. Load a single PNG or a ZIP of animation frames
3. Choose a target palette (or define a custom one)
4. Adjust color matching and dithering settings as needed
5. Preview the result
6. Export the processed frames as a ZIP

## Technical Notes

- All color matching and quantization internally use OKLab vectors, even when a different color space is selected for matching mode. This is required because the relaxation quantizer's scoring formula depends on perceptual L/a/b decomposition — this is a deliberate design constraint, not an oversight.
- Single self-contained HTML file — no external libraries, no build step, no server required.

-------------------------------------

# Fluid Forge

A self-contained, single-file HTML tool for creating pixel-art fluid FX — smoke, fire, explosions, blood, magic, dust — and exporting them as spritesheets for game engines like Phaser or PixiJS.

No build step, no dependencies, no server. Open `fluid-forge.html` in a browser and it works.

## What it does

Fluid Forge runs a real-time 2D fluid simulation (a from-scratch implementation of Jos Stam's *stable fluids* method — semi-Lagrangian advection, Jacobi pressure projection, vorticity confinement) and renders it straight to a low-resolution pixel grid, so the output already looks like retro pixel art instead of needing a separate downsampling pass.

You paint into the simulation with the mouse, or trigger a preset burst, and once you're happy with a few seconds of animation you record it and export a trimmed spritesheet (or a ZIP of individual frames) ready to drop into a game project.

## Features

- **6 built-in presets**: Smoke, Fire, Explosion, Blood, Magic, Dust — each with its own physics (viscosity, buoyancy, gravity, vorticity, decay) and color gradient.
- **Mouse brush** — paint density and velocity directly into the fluid. Adjustable size, density strength, and velocity strength.
- **Burst trigger** — a one-shot radial impulse (density + outward velocity) for explosion-style effects, independent of the mouse.
- **Persistent per-effect color** — color is baked into the material at the moment it's created (by the brush or a burst) and travels with the flow from then on. Switching presets or changing the gradient only affects *new* material, so a red explosion and a gray smoke cloud can coexist on screen without one repainting the other.
- **Detail resolution vs. world size (two independent scales)**
  - *Detail resolution* (32–128) controls how chunky or fine the pixels are, and is the reference scale for brush/burst sizing — so an effect always feels the same size no matter what it's set to.
  - *Effect area / world size* (1×–10× area) controls how much actual room the simulation has around the effect, so plumes and blasts have space to develop before hitting a wall or the domain edge, instead of clipping. Increasing it doesn't change how big or how detailed things look — it just adds margin.
- **Open or closed boundaries** — let fluid flow out of frame, or bounce off solid walls.
- **Full manual color gradient editor** — 4 color stops plus an alpha-contrast curve, used to color freshly spawned material.
- **Recording & export**
  - Record N frames (with optional frame-skip) while the simulation plays.
  - Build a spritesheet, auto-trimmed to the smallest bounding box shared by all recorded frames.
  - Save the spritesheet as a PNG, or save every individual frame as a ZIP (uses a small hand-written, dependency-free ZIP writer — store method, no compression).
- **Play / Pause / Step / Reset** playback controls. Pausing the simulation also pauses recording (no duplicate frames); Step lets you record one frame at a time while paused.

## Using it

1. Open `fluid-forge.html` in any modern browser (Chrome, Firefox, Edge, Safari).
2. Pick a preset, or start tweaking sliders from scratch.
3. Click/drag on the canvas to paint fluid, or hit **Trigger burst** for a one-shot blast.
4. Adjust **Effect area / world size** if the effect is clipping against the edges of the canvas.
5. When it looks good, hit **Record**, let it play (or step manually), then **Stop recording**.
6. Click **Build spritesheet from recorded frames**, then **Save spritesheet PNG** (or **Save frames as ZIP**).

Everything is saved manually via the buttons above — nothing downloads automatically.

## Technical notes

- Simulation and rendering both run on the same low-resolution grid (no separate "hi-res sim → downsample" step), which is what gives the chunky pixel-art look directly.
- Color is stored as its own advected/diffused field (`colR`/`colG`/`colB`, weighted by density) alongside the density field, rather than being derived from density each frame. This is what makes colors persist per-effect instead of being globally repainted when you change presets.
- The detail/world split works by anchoring the diffusion, advection, and pressure-projection scale factors to the *detail resolution* rather than the actual grid size (`GRIDN`). Left as plain grid-size scaling (the textbook Stam approach), a bigger grid doesn't actually buy you more room — movement speed scales up proportionally and the effect still reaches the edge at the same relative point. Anchoring to a fixed reference resolution breaks that proportionality on purpose, so a bigger world genuinely means more space before clipping.
- Grid size is capped at 260×260 cells to keep things real-time in a single-threaded JS solver; very large combinations of detail resolution × world size will cost frame rate.

## Browser support

Needs `Canvas 2D`, `Pointer Events`, and `Blob`/`URL.createObjectURL` — all standard in current browsers. No external scripts are loaded; everything (including the ZIP writer) is inlined in the one file.

