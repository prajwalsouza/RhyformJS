# RhyformJS

Small instructions for mathematical animation in the browser. Draw a shape, transform it into another, and let a reader move through the scene with a slider.

Inspired by Manim's mathematical storytelling, with browser interaction as a first-class part of the scene.

Version **0.3.1** includes GPU 3D scenes, parametric surfaces, tag trees, and extruded equations. Paused 3D scenes let readers drag to rotate; Play restores the authored view, with zoom disabled. Start with [A change of sign](examples/story.html), a complete mathematical story, or explore the [3D studies](examples/three.html) and [3D guide](docs/3d.md). See the [release notes and v0.1 migration notes](CHANGELOG.md). For stable production imports, use a version tag instead of `@main`:

```html
<script src="https://cdn.jsdelivr.net/gh/prajwalsouza/RhyformJS@v0.3.1/rhyform.min.js"></script>
```

You can also [download the versioned browser bundles](https://github.com/prajwalsouza/RhyformJS/releases/tag/v0.3.1) and serve them locally. All bundles embed their license notices. For 3D, use `rhyform-3d.min.js` or the native module `rhyform-3d.module.js`; the smaller `rhyform.min.js` remains 2D-only.

[Open the motion studies](examples/index.html) for runnable code beside each animation, including SVG imports and equation transforms. [Interactive controls](examples/controls.html) demonstrates live parameters and built-in transport. [The original Pythagoras scene](examples/legacy-pythagoras.html) demonstrates the older fluent API on the updated runtime.

## One script, one scene

Download `rhyform.js` or `rhyform.min.js` and serve it alongside your page. The renderer and SVG parser are included. Geometry, text, SVG transforms, playback, and sliders need no framework, CDN, MathJax, or Potrace. There is no install or build step for authors using the supplied bundle.

```html
<div id="stage" style="height: 440px"></div>
<div id="controls"></div>
<script src="rhyform.js"></script>
<script>
  const scene = rhyform.scene('#stage');
  const circle = rhyform.circle({ radius: 1.7 });
  const square = rhyform.square({
    size: 3.4, fill: '#d4a35d'
  });

  const shape = scene.shape(circle);
  shape.draw(1.2);
  scene.wait(0.5);
  shape.transformTo(square, { duration: 1.8 });

  scene.slider('#controls');
  scene.play();
</script>
```

A standalone browser page is supported. This is a browser library, not a DOM-free Node.js renderer. `src/` is modular source for development; the supplied bundles are the distribution entry points; the 3D distribution also provides a native browser ES module. The legacy rendering dependency is **ViewX**, not Vuex; it is now bundled internally.

## Shape instructions

Use `scene.circle(options)`, `scene.square(options)`, `scene.svg(markup, options)`, or `scene.shape(descriptor)` to create an initially hidden object. `rhyform.circle`, `rhyform.square`, `rhyform.path`, and `rhyform.procedural` create descriptors without adding a visible object.

Name the shape descriptions first, then write the animation sequence. A square's size and fill belong to its descriptor; transition duration belongs to `transformTo`. The source `shape` keeps its identity as it adopts a target's appearance. Reusing `circle` later returns it to the original description.

```js
const bloom = rhyform.procedural(t => {
  const a = t * Math.PI * 2;
  const r = 1.5 + 0.35 * Math.cos(5 * a);
  return [r * Math.cos(a), r * Math.sin(a)];
}, { width: 4, fill: '#77aaa1' });

shape.transformTo(bloom, { duration: 2 });
shape.moveTo([2, 1], 1);
shape.hide(0.5);
```

`draw`, `show`, `hide`, `transformTo`, and `moveTo` append timeline clips; their duration is in seconds. A clip's `.startNextImmediately()` starts the next clip at the same time. `scene.wait(seconds)` inserts a pause. Creation order is playback order. Describe a scene before playing it.

Native shape descriptors accept `fill`, `stroke`, `strokeWidth`, and `at: [x, y]`. Circles use `radius`; squares use `size`. Paths and procedural curves fit to `width` (default 4). Procedural functions receive a parameter from 0 to 1 and return `[x, y]` or `{x, y}`; use `{closed: false}` for an open curve. SVG/path coordinates use the SVG downward Y axis and are converted to scene coordinates on import. Procedural functions can opt into `{coordinates: 'scene'}` for upward-positive Y. Placement and `moveTo` also use scene coordinates.

## SVG import and transformation

The fourth [motion study](examples/index.html#import-svg) imports the repository's existing `images/rhyform.svg`, draws all 23 paths, and moves the artwork while preserving its original Bézier/arc commands and colors. “Choose SVG…” lets you run the same sequence with a local file; the file is read in the browser and is never uploaded to a server.

```js
const scene = rhyform.scene('#stage');
const artwork = await rhyform.loadSVG('./images/rhyform.svg', {
  width: 4.5, scene
});
artwork.draw(2);
artwork.moveTo([1.3, 0], 1.8);
scene.slider('#controls');
scene.play();
```

Use an async function or module script for `await`. URL loading needs a static HTTP server and same-origin/CORS access; the file-picker example reads `File.text()` and passes its SVG markup to `scene.svg(...)`.

```js
const shape = scene.svg(sourceSVG, { width: 4 });
shape.show(0.3);
const animation = shape.transformTo({ svg: targetSVG, width: 4 }, {
  duration: 2
});
console.log(animation.strategy); // "contour-morph"

// Alternatively, load a URL (same-origin or CORS-enabled).
const loaded = await rhyform.loadSVG('./drawing.svg', { width: 4, scene });
loaded.draw(1);
```

SVGs and MathJax equations stay vector data. They are not rendered to PNG and traced again. The importer handles standard path commands (`M/L/H/V/C/S/Q/T/A/Z`, absolute and relative), circles, ellipses, rectangles, polygons, polylines, lines, nested group transforms, local `<use>` references, solid paints, and compound paths with `evenodd` or `nonzero` fills. It preserves imported endpoint path data and samples each contour separately for the intermediate frames. `data-key` on a path gives an explicit path correspondence; otherwise path order is used. Contours are matched by area and checked for nesting and winding compatibility.

A morph needs matching path/contour structure and fill rules. Different structures reject with an actionable error. If a dissolve is appropriate, opt in explicitly:

```js
shape.transformTo(otherSVGDescriptor, {
  duration: 1,
  fallback: 'crossfade'
});
```

This is a constrained geometric correspondence, not universal semantic object matching. Arbitrary concave or self-intersecting inputs can still produce poor intermediate geometry. Split/merge choreography and topology-changing surface morphs are not implemented. Equation descriptors additionally support an explicit glyph-matching mode described below.

The importer deliberately rejects unsupported artwork instead of silently flattening it: gradients, patterns, masks, clipping, filters, embedded text/images, CSS stylesheets/transforms, dashed strokes, non-scaling strokes, nested SVG viewports, group-opacity compositing across multiple children, and non-uniformly transformed strokes. Convert text/strokes to paths and flatten those features in the authoring tool first. Use numeric SVG user units. Limits are 2 MB of SVG markup, 256 drawable paths, 128 contours per path, and 1024 contours total. Imported markup is parsed inertly and never mounted as executable SVG.

## Playback and interaction

```js
scene.prepare();      // Compile duration and initial state without playing.
scene.seek(2.4);      // Seconds; pauses playback and samples the timeline.
scene.resume();
scene.pause();
scene.play();         // Replay from the beginning.
scene.clear();        // Remove objects/clips and cancel pending assets.
scene.dispose();      // Also release this scene's space and resize observer.
```

The shared animation clock drives both legacy ViewX objects and new SVG shapes. Seeking is deterministic; `runFunction` callbacks run on playback boundary crossings, not on seeking. Callback side effects cannot be reversed by scrubbing. Audio is paused/resynchronized with playback; browser autoplay policy still applies.

`scene.slider('#controls', {label: 'Progress'})` creates a keyboard-accessible native range control. Its return value has `input`, `element`, and `remove()`. This slider controls timeline time. Remove an individual control with `remove()`; `scene.dispose()` also removes its built-in sliders. The demos explicitly wait for the user to play, including with reduced-motion preferences.

For custom interfaces, `scene.onUpdate(listener)` returns an unsubscribe function; read `currentTime`, `duration`, `playing`, and `lastError`. Only one owner should write a shape's geometry at a time. Concurrent clips for different objects are supported; overlapping transforms on the same shape follow authored order.

## Live parameters and controls

The separate [interactive wave example](examples/controls.html) has amplitude and cycle sliders plus Play/Pause, Restart, and progress scrubbing. The controls come from the library; the example supplies their CSS.

```js
const scene = rhyform.scene('#stage');
const radius = scene.parameter('Radius', {
  value: 1, min: 0.2, max: 2, step: 0.1
});
const circle = scene.liveShape(() =>
  rhyform.circle({ radius: radius.value })
);
circle.show(0);
scene.wait(8);
scene.controls('#controls');
```

`parameter.value = number` updates live geometry immediately, including while paused. Values snap to `step` from `min` and clamp to the range. `parameter.subscribe(listener)` returns an unsubscribe function. Parameters belong to their scene; after clearing or disposing it, writes reject.

`scene.liveShape(factory)` reevaluates its synchronous descriptor factory when a scene parameter or the timeline changes. Read `scene.currentTime` to drive motion, as the wave example does. Factories must be pure: read parameters without modifying them. Live shapes support `show` and `hide`; their factory owns geometry, so `draw`, `transformTo`, and `moveTo` reject instead of competing with it. Use an ordinary `scene.shape` for an authored morph sequence. This is direct reactive geometry, not a general dependency graph or constraint solver.

`scene.controls(container, {parameters, playback})` defaults to all existing scene parameters and `playback: true`. It returns `{element, inputs, remove()}`; `inputs` is a Map from parameters to their range inputs. Native HTML controls work without library CSS. Parameter changes leave time and playback alone; progress scrubbing pauses; Restart replays with the current parameter settings. Clear/dispose removes the control panel and live bindings. A custom interface can pass `playback: false` or a subset of parameters.

## Equation descriptors and matching

MathJax's SVG output already contains vector glyph outlines. The equation path is **LaTeX → MathJax SVG → Rhyform contours → animation**. Potrace is only needed when converting raster pixels to outlines; equations never pass through a bitmap.

Load MathJax's SVG typesetter before authoring equations. For example, include a local copy of `mathjax/es5/tex-svg.js`, or the pinned CDN file shown here, after the Rhyform script:

```html
<script src="rhyform.js"></script>
<script>
  window.MathJax = {
    svg: { fontCache: 'local' },
    startup: { typeset: false }
  };
</script>
<script src="https://cdn.jsdelivr.net/npm/mathjax@3.2.2/es5/tex-svg.js"></script>
```

Inside an async function, describe the targets, then animate:

```js
const scene = rhyform.scene('#stage');
const quadratic = await rhyform.equation('f(x)=x^2');
const cubic = await rhyform.equation('f(x)=x^3');
const equation = scene.shape(quadratic);
equation.draw(1.6);
equation.transformTo(cubic, { duration: 2.4 });
scene.slider('#controls');
scene.play();
```

`rhyform.equation(tex, {scene, width, at, color})` creates an invisible descriptor, like `rhyform.circle`. Defaults: active scene, width 4.5, center `[0,0]`, teal. It waits for MathJax startup and shares the cancellable typesetting queue. Use a local font cache (`local`, the MathJax 3 default, or `none`); references into a global SVG font cache outside the imported SVG are unsupported.

For equations that gain, lose, or rearrange glyphs, opt into structural matching:

```js
equation.transformTo(nextEquation, {
  duration: 2.6, match: 'semantic'
});
```

Matching preserves MathJax's symbol identity and roles such as numerator, denominator, base, and exponent. A global minimum-cost assignment combines these with normalized outline similarity and position. It favours retaining identical symbols, then compatible replacements of the same mathematical type. Matched parts move/reshape with full opacity. Unmatched parts grow from or retract toward related symbols; incompatible contour topology also uses this geometric arrival/departure rule. Transitions do not crossfade.

The returned clip has `strategy: 'semantic-match'` and `correspondence: {matched, reshaped, entering, leaving, pairs}`. Each pair reports source/target path indices and glyph IDs so the chosen mapping is inspectable. This is a structural heuristic, not a computer algebra system: it does not infer the derivation, prove equivalence, or guarantee the intended term mapping. The caller authors the algebraic steps. Explicit term overrides, coherent whole-term grouping, split/merge provenance, and collision-free trajectories remain future work. A change in glyph topology may shrink and grow rather than continuously preserve its holes.

For a simpler alternative, `{match: 'glyphs'}` matches identical glyphs by proximity and fades unmatched parts individually. The default remains strict contour correspondence; whole-asset crossfades require `{fallback: 'crossfade'}`. These are distinct, inspectable strategies.

Examples: [equation → equation](examples/index.html#equations), [π → disk → square → π](examples/index.html#math-to-shape), and [six-step fractional quadratic derivation](examples/index.html#algebra). The π example has compatible single-contour geometry and uses true contour morphs. A whole multi-glyph equation into an arbitrary solid shape still needs a correspondence recipe or an explicit `fallback: 'crossfade'`.

## Existing scenes and optional dependencies

The older `createScene`, `createSpaceInElement`, points, lines, circles, curves, text, tags, and `.change.*` authoring style remains available. Remove old separate ViewX/Potrace script tags for scenes that only need SVG/geometry. `scene.play(index)` retains its animation-index argument; use `scene.seek(seconds)` for time-based scrubbing.

Important differences:

- `generateEquation` and `generateVectorImage` now return a native SVG shape, not a wrapper containing traced `.curves`. `show`, `hide`, `draw`, tags, `.change.expression`, and `.change.url` remain available. Code that reaches into old traced-curve internals must migrate.
- New shape `draw(seconds)` and generated asset `draw(seconds)` take duration. Legacy line/curve `draw(speed)` still takes drawing speed.
- Legacy curves accept Points, `[x,y]`, `{x,y}`, or `{command:'M'|'L',x,y}`. Empty curves fail clearly. Use `createSVG` for Bézier/arc data.
- Existing line/curve endpoints are authored snapshots, not reactive constraints bound to moving Points. Update their geometry explicitly.
- Legacy constructors still use the active scene. Prefer `scene.shape` / `scene.svg` when constructing multiple independent scenes.

**Equations:** load MathJax with SVG output before calling `generateEquation`; pending `MathJax.startup.promise` is awaited. The original-scene example uses MathJax 3.2.2. MathJax is an optional external dependency, not in the Rhyform bundle.

```js
const equation = await rhyform.generateEquation('a^2+b^2', {x: -2, y: 1}, '#247d78', 2);
equation.show(0.4);
const change = await equation.change.expression('a^2+b^2=c^2', 1);
```

Concurrent equation generation is queued. Typesetter errors reject. Legacy expression/URL changes allow a crossfade when contour topology differs; inspect the returned animation's `strategy`. Numeric legacy font sizes are interpreted as multiples of 16 CSS pixels; explicit pixel strings such as `'24px'` also work.

**Raster images:** `generateVectorImage(url, at, stroke, fill, width)` uses an optional Potrace-compatible adapter only for bitmaps. Configure it with `rhyform.configure({potrace: adapter})`; a preloaded `window.Potrace` is also accepted. The adapter supplies `setParameter`, `loadImageFromUrl`, `process(callback)`, and `getSVG`.

Raster jobs are serialized, decoded with explicit failures, limited to 4 megapixels/8 MB, and bounded by a 10-second operation timeout. A cancelled/timed-out running singleton must be replaced with a fresh adapter instance before retrying. The adapter runs on the main thread: a timeout cannot preempt synchronous tracing CPU work. Potrace extracts silhouettes; it cannot recover SVG layers or semantic shape correspondences. No tracer is bundled or automatically downloaded. Review the chosen adapter's license for your application.

## Develop and verify

```sh
npm ci
npm run build
npm test
npm run demo
# Open http://127.0.0.1:8769/examples/
```

Node.js 22+ and npm are development tools only. `npm test` uses installed Chrome, or Playwright Chromium (`npx playwright install chromium`). Additional engines:

```sh
npx playwright install firefox webkit
TEST_BROWSER=firefox node tests/run.mjs
TEST_BROWSER=webkit node tests/run.mjs
npm run check:release
```

Edit `src/`; `scripts/build.mjs` regenerates both root bundles. The build scopes legacy scratch variables inside factories to avoid leaking them onto `window`. ViewX is pinned in `vendor/` with small local compatibility fixes. Its inherited string-based interaction hooks still produce esbuild direct-eval warnings; those hooks are outside the supported Rhyform API. No CDN code is loaded by the core, geometry/SVG studies, or controls example. Equation studies lazily load MathJax 3.2.2, preferring the local development copy and falling back to the pinned CDN.

CI installs from the lockfile, checks consistent release versions and embedded license notices, verifies that supplied bundles exactly reproduce from source, and runs the browser suite. `check:release` also checks the publication file list for ignored artifacts and common private-content patterns; it complements manual review and is not a comprehensive secret scanner. npm publication is disabled by `private: true`; tagged GitHub releases distribute the browser files.

The 2D baseline does not cover every historical consumer or SVG feature. The optional 3D distribution adds sampled geometry, GPU rendering, and explicit assembly recipes; see its [supported scope and limits](docs/3d.md). Natural-language interpretation, general semantic split/merge, and a reactive constraint solver remain outside this version.

## License

MIT. See [LICENSE](LICENSE) and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). Vendored ViewX and svgpath notices are also embedded in both bundles.
