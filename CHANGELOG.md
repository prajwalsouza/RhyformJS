# Changelog

## Unreleased

- Give “A change of sign” a dark, full-screen presentation with bare playback controls and chapter dots that reveal their titles on hover, focus, or tap.
- Keep the transcript, source, and rotation guidance in story notes; support dragging from chapter markers to scrub, keyboard navigation, and a text fallback when MathJax cannot load.
- Check the entire story, responsive framing, chapter navigation, and loading failure behavior. Library bundles remain at v0.3.1.

## v0.3.1

- Enable drag-to-rotate inspection by default while a 3D scene is paused, including after it ends. Rotation orbits the camera target at a fixed distance; zoom and pan are disabled.
- Restore the authored camera view immediately on Play, Resume, or Replay. Inspection does not change geometry, camera clips, or scene time.
- Add arrow-key rotation, Home/Escape reset, `scene.camera.resetView()`, and the scene option `rotateOnPause: false`. Rotation uses on-demand rendering and disconnects its listeners during playback and on disposal.
- Add rotation guidance to all 3D studies and the complete story, plus pointer, keyboard, playback, projection, and lifecycle regression checks.
- Keep playback button contents stable between pointer down/up instead of replacing them each animation frame. The controls regression waits for the pause state before measuring frozen time.

The `v0.3.0` tag remains unchanged. Its GitHub release was not published before these follow-up controls were requested; use `v0.3.1` for the complete 3D release.

## v0.3.0 (tagged candidate)

- Add an optional self-contained Three.js distribution (`rhyform-3d.js`, its minified counterpart, and a browser ES module). Existing 2D bundles remain independent of Three.js.
- Add parametric XYZ curves, sampled surfaces, fills between curves, lofts, revolutions, tubes, ribbons, planar fills with holes, and extrusion.
- Add precise move/rotate/scale/color instructions, deterministic sample correspondence, hierarchical tag selections, sequential/staggered groups, and curve/surface/cube assembly recipes.
- Share the animation clock and native parameter/playback controls across SVG and 3D scenes; release scene-owned GPU resources on disposal.
- Add fourteen runnable 3D studies and a complete seven-chapter story, “A change of sign,” with synchronized equations, narration, chapter navigation, replay, and source.
- Add extruded MathJax equations, structural equation transitions, filled SVG meshes, and explicit single-contour symbol-to-solid transforms without tracing. MathJax remains an optional separately loaded typesetter.
- Keep interaction optional: no pointer listeners or picking loop are installed by 3D scenes. Object event handlers, vector export, and arbitrary mesh morphing are not implemented in this version.


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
