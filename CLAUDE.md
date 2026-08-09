# SLAMMERS — project rules

- Ships as a single self-contained `index.html`, generated from `src/` by `python3 build.py`
  (plain file concatenation in filename order — no npm, no bundler, no modules). **Never edit
  `index.html` directly** — edit `src/`, run the build, commit both. `build.py --artifact OUT`
  also emits the artifact-viewer copy (wrapper tags stripped).
- All tazo art is procedural from pixel-grid strings in `DESIGNS`. Never add image assets.
- Mobile portrait is the primary target. Test framing at 430×930.
- Physics constants live at the top of the sim section (the `TUNE` object), labeled for tuning.
- Every tazo effect is a data key resolved in the capture pipeline (`captureTazo`). Every house rule is a data key with defined hooks (impulse in / impulse out). No special-case logic anywhere else.
- Vocabulary: Binder, Pot, House Rules, Court. Never use borrowed roguelite/deckbuilder terms in UI copy.
- Mobile webview budget: `setPixelRatio(1)`, `antialias:false`, near plane 1 / far 80, no shadows, no fog, floor decals lifted to y≈0.02 with `depthWrite:false`. Resize is debounced + scheduled (250/750/1500/3000ms) — never per-frame.
- Diagnostics stay in: sessionStorage breadcrumbs (`mark()`), `window.onerror` banner, context-lost handler, version badge.
- Headless verification: open `index.html?auto=1` — the run auto-plays both sides and appends results to the hidden `#testlog` div and `document.title`. Works in headless Chromium with `--virtual-time-budget`.
