import { parseSVG, fitAsset } from './svg.js';

export function installAssets(api) {
  let mathQueue = Promise.resolve(), mathEngine = null, traceQueue = Promise.resolve(), tracer = null, tracerPoisoned = false;
  api.configure = options => { if ('potrace' in options) { tracer = options.potrace; tracerPoisoned = false; } return api; };
  function abortError() { return new DOMException('Scene or asset operation cancelled', 'AbortError'); }
  function bounded(promise, signal, timeout = 10000) {
    return new Promise((resolve, reject) => {
      let timer;
      const cleanup = () => { clearTimeout(timer); signal?.removeEventListener('abort', abort); };
      const abort = () => { cleanup(); reject(abortError()); };
      if (signal?.aborted) return abort();
      signal?.addEventListener('abort', abort, { once: true });
      timer = setTimeout(() => { cleanup(); reject(new Error('Asset operation timed out')); }, timeout);
      Promise.resolve(promise).then(value => { cleanup(); resolve(value); }, error => { cleanup(); reject(error); });
    });
  }
  async function job(scene, work) {
    if ((!scene?.selectedSpace && scene?.dimensions !== 3) || scene.disposed) throw new Error('Create a scene and select its space before loading an asset');
    const epoch = scene.epoch, controller = new AbortController();
    (scene.pendingAssets ||= new Set()).add(controller);
    try {
      const result = await bounded(work(controller.signal), controller.signal);
      if (scene.disposed || scene.epoch !== epoch) throw abortError();
      return result;
    } finally { controller.abort(); scene.pendingAssets.delete(controller); }
  }
  async function mathAsset(expression, signal) {
    const math = globalThis.MathJax;
    if (!math) throw new Error('Equations need MathJax with SVG output. Load MathJax before creating an equation.');
    if (math !== mathEngine) { mathEngine = math; mathQueue = Promise.resolve(); }
    const render = async () => {
      if (signal.aborted) throw abortError();
      if (math.startup?.promise) await bounded(math.startup.promise, signal);
      if (signal.aborted) throw abortError();
      if (typeof math.tex2svgPromise !== 'function') throw new Error('MathJax SVG output is not ready');
      // Caller cancellation settles immediately, but the shared queue retains this
      // slot until MathJax itself finishes, so a late completion cannot overlap work.
      const container = await math.tex2svgPromise(expression, { display: true });
      if (signal.aborted) throw abortError();
      const svg = container.querySelector('svg') || container;
      return parseSVG(svg.outerHTML);
    };
    const result = mathQueue.then(render, render);
    mathQueue = result.catch(() => {});
    return result;
  }
  async function rasterAsset(blob, signal) {
    const run = async () => {
      if (signal.aborted) throw abortError();
      const engine = tracer || globalThis.Potrace;
      if (!engine) throw new Error('Raster tracing requires an optional Potrace adapter. SVG import does not require Potrace.');
      if (tracerPoisoned) throw new Error('The raster tracer timed out. Configure a fresh tracer instance before retrying.');
      const url = URL.createObjectURL(blob), image = new Image();
      try {
        await bounded(new Promise((resolve, reject) => { image.onload = resolve; image.onerror = () => reject(new Error('Cannot decode raster image')); image.src = url; }), signal);
        if (image.width * image.height > 4_000_000) throw new Error('Raster tracing is limited to 4 megapixels; resize the input first');
        const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height;
        const ctx = canvas.getContext('2d'); ctx.fillStyle = 'white'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.drawImage(image, 0, 0);
        engine.setParameter({ turdsize: .1, alphamax: 1, optcurve: true, opttolerance: .2 });
        engine.loadImageFromUrl(canvas.toDataURL('image/png'));
        try {
          const svg = await bounded(new Promise((resolve, reject) => {
            engine.process(() => { try { resolve(engine.getSVG(1)); } catch (error) { reject(error); } });
          }), signal);
          return parseSVG(svg);
        } catch (error) {
          // This old singleton has no cancel API. Never hand a timed-out callback the next job.
          tracerPoisoned = true; throw error;
        }
      } finally { URL.revokeObjectURL(url); image.onload = image.onerror = null; }
    };
    const result = traceQueue.then(run, run); traceQueue = result.catch(() => {}); return result;
  }
  async function loadAsset(source, signal) {
    if (typeof source !== 'string') throw new TypeError('Expected SVG markup or an image URL');
    if (source.trimStart().startsWith('<')) return parseSVG(source);
    const response = await fetch(source, { signal });
    if (!response.ok) throw new Error(`Could not load image (${response.status})`);
    const blob = await response.blob();
    if (blob.size > 8_000_000) throw new Error('Image exceeds the 8 MB import limit');
    if (/svg|xml/.test(blob.type) || /\.svg(?:[?#]|$)/i.test(source)) return parseSVG(await blob.text());
    return rasterAsset(blob, signal);
  }
  api.ready = async () => api;
  api.equation = async (expression, { scene = api.activeScene, width = 4.5, at = [0, 0], color = '#247d78' } = {}) => {
    const asset = await job(scene, signal => mathAsset(expression, signal));
    return { ...fitAsset(asset, { width, at, centered: true, fill: color }), kind: 'equation', expression };
  };
  api.generateEquation = async (expression = 'x', at = { x: 0, y: 0 }, color = 'white', fontSize = '20px') => {
    const scene = api.activeScene;
    const asset = await job(scene, signal => mathAsset(expression, signal));
    // MathJax viewBox uses 1000 units/em. Retain numeric legacy font-size behavior.
    const em = typeof fontSize === 'number' ? fontSize * 16 : parseFloat(fontSize);
    if (!Number.isFinite(em) || em <= 0) throw new Error('fontSize must be positive');
    const scale = em / scene.selectedSpace.camera.pixelsPerUnit / 1000;
    const fit = raw => fitAsset(raw, { at, width: raw.bounds[2] * scale, fill: color });
    const shape = api._shapeFromAsset(fit(asset), scene); shape.expression = expression; shape.fontSize = fontSize;
    shape.change.expression = async (next, seconds = 1) => {
      const raw = await job(scene, signal => mathAsset(next, signal));
      if (shape.removed) throw abortError();
      const animation = shape.transformTo(fit(raw), { duration: seconds, fallback: 'crossfade', label: 'Equation' });
      shape.expression = next; return animation;
    };
    return shape;
  };
  api.generateVectorImage = async (source, at = { x: 0, y: 0 }, color = 'white', fillcolor = 'none', width = 1) => {
    const scene = api.activeScene;
    const raw = await job(scene, signal => loadAsset(source, signal));
    const fit = asset => fitAsset(asset, { at, width, color, fill: fillcolor });
    const shape = api._shapeFromAsset(fit(raw), scene); shape.url = source;
    shape.change.url = async (next, seconds = 1) => {
      const raw = await job(scene, signal => loadAsset(next, signal));
      if (shape.removed) throw abortError();
      const animation = shape.transformTo(fit(raw), { duration: seconds, fallback: 'crossfade' }); shape.url = next; return animation;
    };
    return shape;
  };
  api.loadSVG = async (url, options = {}) => {
    const scene = options.scene || api.activeScene;
    const raw = await job(scene, async signal => {
      const response = await fetch(url, { signal });
      if (!response.ok) throw new Error(`Could not load SVG (${response.status})`);
      return parseSVG(await response.text());
    });
    return api._shapeFromAsset(fitAsset(raw, { centered: true, ...options }), scene);
  };
}
