# Changelog

## v0.2.1

Publishes the 2D update below after fixing a timing race in the audio-scheduling regression test. The initial assertion now runs synchronously with playback startup, then waits for the scheduled event instead of assuming a browser round trip completes before the cue. Animation behavior is unchanged from the v0.2.0 candidate.

The `v0.2.0` tag was already public when a repeated CI run exposed the test race. Its GitHub release was withheld and its tag is preserved unchanged; use `v0.2.1` for this release.

## v0.2.0 (tagged candidate)

A browser-first 2D update with direct SVG import, deterministic playback, equation correspondence, and live parameter controls.

### Added

- Self-contained `rhyform.js` and `rhyform.min.js` browser bundles with ViewX and the SVG path parser included.
- Named circle, square, path, procedural, and asynchronous equation descriptors.
- Direct SVG imports preserving compound contours, holes, solid paints, transforms, and exact endpoint paths.
- Structural equation matching using glyph identity, mathematical role, outline similarity, and location. Inspectable correspondence maps; geometric arrival/departure without transition crossfades.
- Scene-owned parameters, live shapes, native parameter sliders, and built-in playback controls.
- Seven motion studies and a separate interactive-controls example, with the running source beside each scene.
- Browser regression tests, reproducible bundle checks, and CI for Chromium, WebKit, and Firefox.

### Fixed

- Core startup no longer requires MathJax or Potrace. SVGs and equations stay vector data instead of being rasterized and retraced.
- Pause, resume, seek, replay, grouped clips, and timeline endpoint behavior share one animation clock.
- Empty scenes, primitive circle hiding, singleton curves, missing point z coordinates, stale point bounds, and default legacy sliders.
- Concurrent equation jobs, cancellation, failed imports, stale async results, scene disposal, and private scratch-global leakage.
- Imported SVG movement preserves original curve commands throughout translation.

### Migration from v0.1

- Replace the old separately loaded ViewX/Potrace scripts with the bundled Rhyform script for geometry/SVG scenes. MathJax SVG output remains an optional external dependency for equations; bitmap tracing still requires an optional adapter.
- `generateEquation` and `generateVectorImage` return native SVG shapes. Public drawing/changing/tag methods remain, but old `.curves` internals are no longer present.
- Native/generated shape `draw(seconds)` takes duration; legacy line/curve `draw(speed)` retains its drawing-speed argument.
- `scene.play(index)` still takes an animation index; use `scene.seek(seconds)` for time. Callback side effects are not replayed by scrubbing.
- The new parameter/live-shape API is reactive. Legacy point/line constructions remain authored snapshots.
- Pin production imports to `v0.2.1` or an exact commit. Imports from `@main` change when the default branch changes. The existing `v0.1` tag remains available for older consumers.

### Limits

This is a 2D release. It does not implement 3D, arbitrary SVG filters/gradients/masks, general semantic split/merge, or an algebra solver. Equation matching is a structural heuristic and does not guarantee the intended mapping for every expression. Read the README's supported SVG subset and compatibility notes before upgrading an existing scene. MathJax/Potrace adapters and legacy ViewX interaction hooks are not an unrestricted-input sandbox.

## v0.1

Original experimental RhyformJS release (2023), using separately loaded ViewX, MathJax, and Potrace.
