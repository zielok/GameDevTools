# Forge Suite

A collection of self-contained, browser-based tools for pixel art and 2D game development. Each tool is a single HTML file with **zero external dependencies** — no CDN, no build step, no server. Just open the file in a modern browser.

Designed for workflows compatible with engines like GameMaker, Phaser, and PixiJS.

---

## Pixel Forge

*Pixel art editor.*

A full-featured pixel art editor with a broad toolset:

- Pencil, pixel-perfect pencil (no fat diagonal pixels), eraser, line, rectangle/ellipse (outline & filled), fill, eyedropper, rectangle select, magnifier
- Dithered gradient fill
- Artifact cleanup based on Connected Component Labeling (CCL)
- Preset retro palettes plus custom color support, with image color-picking
- Undo/redo
- Zoom, fit-to-screen, and actual-size (1:1) view
- Viewport-clipped overlay canvas for smooth performance on large canvases

---

## Sprite Forge

*Pixel art palette converter.*

Converts PNG animation frames to a target retro color palette:

- Built-in palettes: DB32, DawnBringer 16, PICO-8, Sweetie 16, Endesga 32, C64, Game Boy variants, CGA, 1-bit, plus custom hex palettes
- Perceptual color matching in OKLab color space
- Iterative relaxation quantizer (color similarity, lightness, neighbor coherence, gradient direction)
- Dithering: ordered (Bayer 2x2/4x4/8x8), checkerboard, blue noise (void-and-cluster), shadow/highlight-aware, with Sobel edge protection
- Dither mask system that protects intentional dithering from cleanup passes
- Artifact cleanup: alpha edge decontamination, despeckle, island removal (8-connected), hole filling
- Batch processing via ZIP input/output

---

## Particle Forge

*2D particle effect editor.*

A comprehensive particle editor for game VFX:

- Multi-emitter system with independent physics, visuals, and timeline per emitter
- Noise-based turbulence and global force fields (attractors/repulsors, circle or rectangle shape)
- Sub-emitters with Trail (continuous spawn along parent path) and Death Burst (spawn on parent expiry) modes
- 11 built-in particle shapes plus animated spritesheet textures
- Color randomization and independent X/Y scale curves over particle lifetime
- Resizable stage, spritesheet/ZIP export, aspect-ratio locking, 1-bit alpha for retro effects

---

## Fluid Forge

*2D fluid simulation.*

A real-time fluid simulator (Jos Stam's stable fluids method: semi-Lagrangian advection, Jacobi pressure projection) for generating water/smoke-style effects:

- Configurable simulation speed, gravity, viscosity, and pressure iteration count
- Independent density diffusion, decay, and strength controls
- Velocity strength and damping
- Interactive mouse brush for injecting fluid directly into the simulation
- Configurable boundary behavior
- Separate controls for detail resolution vs. effect area / world size, so increasing world size doesn't just proportionally rescale motion
- Spritesheet export with configurable columns, capture rate (every Nth frame), frame limit, and pixel size / alpha contrast controls for pixel-art-style output

---

## Anim Forge

*Animation compositor.*

Assembles sprites and frames into multi-track animation sequences:

- Multi-track timeline (segments per track) for compositing layered animations
- Playback controls (play/pause, rewind) with configurable FPS and playback speed (px/frame)
- Zoomable timeline view

---

## Bone Forge

*Pixel art skeletal animator.*

A 2D skeletal animation tool built for pixel art sprites:

- Hierarchical bone system (add, reorder, parent/child relationships affecting draw order)
- Select & rotate tool and Inverse Kinematics (IK) chain dragging
- Keyframe-based animation with per-bone and "bake all" keyframing
- Easing curves: linear, ease-in, ease-out, ease-in-out, step
- Onion skinning for animating in context
- Copy/paste pose between frames
- Pan/zoom canvas navigation
- Undo/redo
- Project save/load as JSON

---

## Anim Mesh Forge

*Keyframe mesh animator.*

Deforms a single sprite over time using a mesh of vertices, instead of frame-by-frame redrawing:

- Auto-generate a grid mesh or a mesh from the sprite's alpha channel, or draw one manually on the PNG
- Add/delete vertices and re-triangulate the mesh
- Select/Move and Deform tools for posing the mesh per frame
- Keyframe-based animation with linear, ease-in, ease-out, bounce, and elastic interpolation
- Frame-by-frame navigation (first/prev/next/last) plus play/stop preview
- Undo/redo
- Export as PNG frame sequence in a ZIP

---

## License

MIT
