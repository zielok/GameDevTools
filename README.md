# Forge Suite

A collection of self-contained, browser-based tools for pixel art and 2D game development. Each tool is a single HTML file — no build step, no server. Just open the file in a modern browser.

All tools work fully offline. The only network request is made by **Particle Forge**, which loads its UI fonts (Space Grotesk, JetBrains Mono) from Google Fonts; offline it falls back to system fonts and works normally.

Designed for workflows compatible with engines like GameMaker, Phaser, and PixiJS.

---

## Pixel Forge

*Pixel art editor and animator.* — `pixel-forge.html`

A full-featured pixel art editor with layers and frame-based animation:

- **Drawing:** pencil, pixel-perfect pencil (no fat diagonal pixels), eraser, line, rectangle/ellipse (outline & filled), flood fill, dithered gradient (Bayer pattern, foreground → background), eyedropper, brush size/shape and custom brush stamps
- **Text:** built-in 5×7 pixel font or system fonts
- **Shading Ink:** shifts pixels lighter/darker along a color ramp picked from the palette
- **Selection:** rectangle, lasso, magic wand (with tolerance), add/subtract modes; move, copy, cut, paste
- **Layers:** add, duplicate, delete, reorder, merge down, flatten, per-layer visibility and opacity
- **Animation:** frames (add/duplicate/delete, per-frame duration), named tags for frame ranges, onion skinning, playback preview
- **Symmetry** (horizontal, vertical, both, 4-way) and **tile mode** for seamless textures
- **Transforms:** flip, rotate 90°/180°, resize (nearest or bilinear), crop to content, one-click outline
- **Palette:** retro presets (PICO-8, Game Boy, CGA, NES, DB16, DB32, Endesga 32, Lospec500 and more), palette from image, sorting, color count, find & replace color with tolerance
- **Cleanup:** finds orphan pixels and small color islands with Connected Component Labeling (CCL) and fixes them one by one or all at once
- Reference image overlay
- Undo/redo of the whole document (pixels, layers, frames, transforms, resizes)
- Zoom, fit-to-screen, magnifier, pixel grid
- **Files:** open/save PNG, save/load projects as `.pfp` (layers, frames, tags), export a PNG sprite sheet (one per tag) and/or a ZIP of frames

---

## Sprite Forge

*Pixel art palette converter.* — `sprite-forge.html`

Converts PNG animation frames to a target retro color palette:

- Built-in palettes: DB32, DawnBringer 16, PICO-8, Sweetie 16, Endesga 32, C64, Game Boy variants, CGA, 1-bit, plus custom hex palettes
- Perceptual color matching in OKLab color space
- Iterative relaxation quantizer (color similarity, lightness, neighbor coherence, gradient direction)
- Dithering: ordered (Bayer 2x2/4x4/8x8), checkerboard, blue noise (void-and-cluster), shadow/highlight-aware, with Sobel edge protection
- Dither mask system that protects intentional dithering from cleanup passes
- Artifact cleanup: alpha edge decontamination, despeckle, island removal (8-connected), hole filling
- Batch processing via ZIP input/output (built-in ZIP reader/writer, stored and deflate input), with per-frame progress

---

## Particle Forge

*2D particle effect editor.* — `particle-editor-en.html`

A comprehensive particle editor for game VFX:

- Multi-emitter system with independent physics, visuals, and timeline per emitter
- Noise-based turbulence and global force fields (attractors/repulsors, circle or rectangle shape)
- Sub-emitters with Trail (continuous spawn along parent path) and Death Burst (spawn on parent expiry) modes
- 11 built-in particle shapes plus animated spritesheet textures
- Color randomization and independent X/Y scale curves over particle lifetime
- Resizable stage, spritesheet/ZIP export, aspect-ratio locking, 1-bit alpha for retro effects
- **Seamless loop export:** the last frame flows into the first and the effect is at full density from frame 1 (particles still alive at the end of the loop are wrapped around to its start); the editor suggests a loop length matching the effect's burst/timeline cycle
- **Pre-warm:** start the export after N seconds of simulation instead of from an empty scene
- Effect presets (fire, smoke, explosion, rain, snow, fireworks, portal and more), project save/load as JSON, autosave in the browser

---

## Fluid Forge

*2D fluid simulation.* — `fluid-forge.html`

A real-time fluid simulator (Jos Stam's stable fluids method: semi-Lagrangian advection, pressure projection solved with Gauss–Seidel iterations) for generating smoke, fire, explosion, blood, magic and dust effects:

- Presets for each effect type, with a 4-stop spawn color gradient that travels with the fluid
- Configurable simulation speed, gravity, buoyancy, vorticity (swirl), viscosity, and pressure iteration count
- Independent density diffusion, decay, and strength controls
- Velocity strength and damping
- Interactive mouse brush for injecting fluid directly into the simulation
- Configurable boundary behavior
- Separate controls for detail resolution vs. effect area / world size, so increasing world size doesn't just proportionally rescale motion
- Spritesheet export with configurable columns, capture rate (every Nth frame), frame limit and trimming to the shared content area; also exports frames as a ZIP
- Exported frames are always 1 pixel per simulation cell (pixel-art-style output); "pixel size on screen" only changes the preview, and alpha contrast shapes the output alpha

---

## Anim Forge

*Animation compositor.* — `AnimForge.html`

Assembles sprites and frames into multi-track animation sequences:

- Loads ZIPs of PNG frames (e.g. exported from the other Forge tools) as segments
- 4-track timeline (segments per track) for compositing layered animations, with per-segment start frame, blend mode and opacity
- Frame trimming (delete selected frames or the last N)
- Drag segments with the mouse to change their start frame or move them to another track
- Playback controls (play/pause, rewind, loop) with configurable FPS, zoomable timeline and preview
- Undo/redo, and project save/load as JSON (frames embedded)
- Export of the composited animation as a ZIP of PNG frames, with optional nearest-neighbour upscaling

---

## Bone Forge

*Pixel art skeletal animator.* — `bone-forge.html`

A 2D skeletal animation tool built for pixel art sprites:

- Hierarchical bone system (add, reorder, parent/child relationships affecting draw order)
- Select & rotate tool and Inverse Kinematics (IK) chain dragging
- Keyframe-based animation with per-bone and "bake all" keyframing
- Easing per segment (linear, ease-in, ease-out, ease-in-out, step): each pair of keyframes has its own curve, editable for the selected keyframes or the segment under the playhead
- Onion skinning for animating in context
- Copy/paste pose between frames
- Pan/zoom canvas navigation
- Undo/redo
- Project save/load as JSON (sprites embedded)
- Export of an animation as a ZIP of PNG frames

---

## Anim Mesh Forge

*Keyframe mesh animator.* — `AnimMeshForge.html`

Deforms a single sprite over time using a mesh of vertices, instead of frame-by-frame redrawing:

- Auto-generate a grid mesh or a mesh from the sprite's alpha channel, or draw one manually on the PNG
- Add/delete vertices and re-triangulate the mesh
- Select tool edits the mesh itself (rest positions), Deform tool poses it per frame (auto-keyframing)
- Keyframe-based animation with per-segment easing (linear, ease-in, ease-out, ease-in-out, bounce, elastic, step); the timeline shows each segment's curve
- Frame-by-frame navigation (first/prev/next/last) plus play/stop preview
- Undo/redo
- Export as PNG frame sequence in a ZIP

---

## Tests

`tests/` contains end-to-end tests that drive each tool in headless Chrome with real mouse and keyboard input — no npm install needed (Node 22+ and Chrome). Run them with `node tests/run.mjs`; see [tests/README.md](tests/README.md).

---

## License

MIT — see [LICENSE](LICENSE).
