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

## License

MIT
License
MIT
