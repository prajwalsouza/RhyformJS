import svgpath from 'svgpath';
import { prepareGlyphMorph, prepareSemanticMorph } from './math-morph.js';
import { installSceneControls } from './controls.js';
import { parseSVG, fitAsset, prepareMorph, svgElement, samplePath, finite, duration, clamp } from './svg.js';

export function installShapes(api, viewX) {
  let serial = 0;
  function animate(scene, sample, seconds, label = '') {
    duration(seconds);
    if (scene.disposed) throw new Error('Scene is disposed');
    const animation = {
      name: `custom-${scene.name}-${scene.animationAdditionIndex++}`,
      type: 'custom', duration: seconds, animationOptions: { sample }, label,
      animateNextImmediately: false,
      startNextImmediately() { this.animateNextImmediately = true; scene.invalidate(); return this; }
    };
    scene.animations[animation.name] = animation; scene.invalidate(); return animation;
  }
  api._animate = animate;

  class Shape {
    constructor(asset, scene = api.activeScene) {
      if (!scene?.selectedSpace || scene.disposed) throw new Error('Create a scene and select a space first');
      this.scene = scene; this.space = scene.selectedSpace; this.name = `svg-${serial++}`;
      this.asset = this.target = asset; this.tags = []; this.removed = false;
      this.setBounds(asset);
      this.element = svgElement('g'); this.element.dataset.rhyform = this.name;
      this.element.style.opacity = '0';
      document.getElementById(this.space.name + '-graph').appendChild(this.element);
      this.addTag('<scene>' + scene.name);
      this.render(asset);
      this.change = { to: (target, seconds = 1) => this.transformTo(target, { duration: seconds }) };
    }
    addTag(tag) { if (!this.tags.includes(tag)) { this.tags.push(tag); (api.tags[tag] ||= []).push(this); } return this; }
    removeTag(tag) { this.tags = this.tags.filter(t => t !== tag); api.tags[tag] = (api.tags[tag] || []).filter(o => o !== this); return this; }
    setBounds(asset) {
      const [x, y, w, h] = asset.bounds;
      this.bounds = { xmin: x, xmax: x + w, ymin: y, ymax: y + h, zmin: 0, zmax: 0, center: { x: x + w / 2, y: y + h / 2, z: 0 } };
      this.coordinates = { x, y: y + h, z: 0 };
    }
    render(asset) {
      if (this.removed) return;
      this.asset = asset;
      const data = viewX.graphData[this.space.name + '-graph'];
      const x = v => viewX.graphToScaledX(v, data.xmin, data.xmax, data.aspectratio);
      const y = v => viewX.graphToScaledY(v, data.ymin, data.ymax, data.aspectratio);
      this.element.setAttribute('transform', `matrix(${x(1) - x(0)} 0 0 ${y(1) - y(0)} ${x(0)} ${y(0)})`);
      while (this.element.children.length > asset.paths.length) this.element.lastChild.remove();
      asset.paths.forEach((path, i) => {
        const el = this.element.children[i] || this.element.appendChild(svgElement('path'));
        for (const [key, value] of Object.entries({ d: path.d, fill: path.fill, stroke: path.stroke, 'fill-rule': path.fillRule, 'stroke-width': path.strokeWidth, opacity: path.opacity, 'fill-opacity': path.fillOpacity, 'stroke-opacity': path.strokeOpacity, 'stroke-linejoin': path.linejoin || 'round', 'stroke-linecap': path.linecap || 'round', 'stroke-miterlimit': path.miterlimit || 4 })) el.setAttribute(key, value);
      });
    }
    show(seconds = .4) { return animate(this.scene, p => { this.element.style.opacity = p; }, seconds, 'Show'); }
    hide(seconds = .4) { return animate(this.scene, p => { this.element.style.opacity = 1 - p; }, seconds, 'Hide'); }
    draw(seconds = 1) {
      const asset = this.target;
      const lengths = asset.paths.map(p => { const node = svgElement('path'); node.setAttribute('d', p.d); return node.getTotalLength(); });
      return animate(this.scene, progress => {
        this.render(asset); this.element.style.opacity = progress === 0 ? 0 : 1;
        [...this.element.children].forEach((node, i) => {
          const p = asset.paths[i];
          // Outlines reveal by length; fills arrive gently near the end.
          node.setAttribute('stroke', p.stroke === 'none' || p.strokeWidth === 0 ? p.fill : p.stroke);
          node.setAttribute('stroke-width', p.strokeWidth || .025);
          node.style.strokeDasharray = String(lengths[i]);
          node.style.strokeDashoffset = String(lengths[i] * (1 - progress));
          node.setAttribute('fill-opacity', p.fillOpacity * clamp((progress - .65) / .35));
          if (progress === 1) { node.setAttribute('stroke', p.stroke); node.setAttribute('stroke-width', p.strokeWidth); node.style.strokeDasharray = ''; node.style.strokeDashoffset = ''; }
        });
      }, seconds, 'Draw');
    }
    transformTo(target, { duration: seconds = 1.4, fallback = 'error', match, label = 'Transform' } = {}) {
      const asset = target instanceof Shape ? target.target : target.paths ? target : descriptor(target);
      if (match !== undefined && !['glyphs', 'semantic'].includes(match)) throw new Error('Unknown correspondence mode');
      const plan = match === 'semantic' ? prepareSemanticMorph(this.target, asset) : match === 'glyphs' ? prepareGlyphMorph(this.target, asset) : prepareMorph(this.target, asset, { fallback });
      const animation = animate(this.scene, p => {
        // Smoothstep has zero velocity at both ends and is reversible by seeking.
        this.render(plan.sample(p * p * (3 - 2 * p)));
        for (const node of this.element.children) { node.style.strokeDasharray = ''; node.style.strokeDashoffset = ''; }
      }, seconds, label);
      animation.strategy = plan.strategy;
      if (plan.correspondence) animation.correspondence = plan.correspondence;
      this.target = asset;
      this.setBounds(asset);
      return animation;
    }
    moveTo(at, seconds = 1) {
      const a = this.target;
      const [x, y, w, h] = a.bounds;
      const dx = finite(at.x ?? at[0]) - (x + w / 2), dy = finite(at.y ?? at[1]) - (y + h / 2);
      const translated = (tx, ty) => ({ ...a, bounds: [x + tx, y + ty, w, h], paths: a.paths.map(p => ({
        ...p, d: svgpath(p.d).translate(tx, ty).toString(),
        contours: p.contours?.map(c => ({ ...c, d: svgpath(c.d).translate(tx, ty).toString(), points: c.points.map(point => ({ x: point.x + tx, y: point.y + ty })) }))
      })) });
      const target = translated(dx, dy);
      // Translation preserves the original Bézier/arc commands; it is not a morph.
      const animation = animate(this.scene, p => {
        const t = p * p * (3 - 2 * p);
        this.render(p === 0 ? a : p === 1 ? target : translated(dx * t, dy * t));
      }, seconds, 'Move');
      animation.strategy = 'translate'; this.target = target; this.setBounds(target);
      return animation;
    }
    remove() { if (this.removed) return; this.removed = true; this.element.remove(); for (const tag of [...this.tags]) this.removeTag(tag); }
    duplicate() { return new Shape(this.target, this.scene); }
  }
  function descriptor(value) {
    if (value.paths) return value;
    if (typeof value === 'string') return fitAsset(parseSVG(value), { centered: true });
    return fitAsset(parseSVG(value.svg), { width: value.width ?? 4, at: value.at ?? [0, 0], centered: value.centered ?? true });
  }
  function paint({ fill = 'none', stroke = '#247d78', strokeWidth = .04 } = {}) {
    // Constructed descriptors use validated values, not imported XML interpolation.
    if (!CSS.supports('color', fill) && fill !== 'none') throw new Error('Invalid fill color');
    if (!CSS.supports('color', stroke) && stroke !== 'none') throw new Error('Invalid stroke color');
    finite(strokeWidth); if (strokeWidth < 0) throw new Error('Stroke width must be non-negative');
    return `fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"`;
  }
  api.circle = (options = {}) => {
    const radius = finite(options.radius ?? 2); if (radius <= 0) throw new Error('Radius must be positive');
    return descriptor({ svg: `<svg viewBox="${-radius} ${-radius} ${radius * 2} ${radius * 2}"><circle r="${radius}" ${paint(options)}/></svg>`, width: radius * 2, at: options.at });
  };
  api.square = (options = {}) => {
    const size = finite(options.size ?? options.side ?? 4); if (size <= 0) throw new Error('Size must be positive');
    return descriptor({ svg: `<svg viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" ${paint(options)}/></svg>`, width: size, at: options.at });
  };
  api.path = (d, options = {}) => {
    const element = svgElement('path'); element.setAttribute('d', d);
    // Use XML serialization so a caller's path data can never create extra elements.
    const source = `<svg><g ${paint(options)}>${element.outerHTML}</g></svg>`;
    return descriptor({ svg: source, ...options });
  };
  api.procedural = (generate, options = {}) => {
    const count = options.samples ?? 192;
    if (!Number.isInteger(count) || count < 3 || count > 512) throw new Error('Use 3–512 samples');
    const coordinates = options.coordinates ?? 'svg';
    if (!['svg', 'scene'].includes(coordinates)) throw new Error('coordinates must be "svg" or "scene"');
    const points = Array.from({ length: count }, (_, i) => {
      const p = generate(i / (options.closed === false ? count - 1 : count));
      return `${i ? 'L' : 'M'}${finite(p.x ?? p[0])} ${finite(p.y ?? p[1]) * (coordinates === 'scene' ? -1 : 1)}`;
    });
    return api.path(points.join(' ') + (options.closed === false ? '' : 'Z'), options);
  };
  api.createSVG = (source, options = {}) => new Shape(fitAsset(parseSVG(source), { centered: true, ...options }));
  api.createShape = value => new Shape(descriptor(value));
  api._shapeFromAsset = (asset, scene) => new Shape(asset, scene);
  api.transform = (shape, target, options) => shape.transformTo(target, options);
  api.scene = (selector, { name = `scene-${serial++}`, bounds = { x: -5, y: -3, width: 10, height: 6 } } = {}) => {
    const host = typeof selector === 'string' ? document.querySelector(selector) : null;
    if (!host) throw new Error('Scene container not found');
    if (api.scenes[name]) throw new Error(`Scene ${name} already exists`);
    for (const key of ['x', 'y', 'width', 'height']) finite(bounds[key], `bounds.${key}`);
    if (bounds.width <= 0 || bounds.height <= 0) throw new Error('Scene bounds must have positive dimensions');
    const scene = api.createScene(name), space = api.createSpaceInElement(selector, `${name}-space`);
    space.element.style.height = '100%'; space.svgLayer.style.height = '100%';
    scene.selectSpace(space); space.camera.setBounds(bounds);
    scene.shape = input => new Shape(descriptor(input), scene);
    scene.circle = options => scene.shape(api.circle(options));
    scene.square = options => scene.shape(api.square(options));
    scene.svg = (source, options = {}) => new Shape(fitAsset(parseSVG(source), { centered: true, ...options }), scene);
    scene.wait = seconds => animate(scene, () => {}, seconds, 'Hold');
    const live = installSceneControls(scene);
    scene.liveShape = generate => {
      if (typeof generate !== 'function') throw new TypeError('liveShape expects a function');
      const shape = scene.shape(generate());
      const unbind = live.bind(() => {
        if (shape.removed) return;
        const asset = descriptor(generate());shape.target = asset;shape.setBounds(asset);shape.render(asset);
      });
      const remove = shape.remove.bind(shape);shape.remove = () => { unbind();remove(); };
      for (const method of ['draw', 'transformTo', 'moveTo']) shape[method] = () => { throw new Error('Live shapes derive their geometry from parameters and scene.currentTime; use show/hide for visibility'); };
      return shape;
    };
    const controls = new Set();
    scene.slider = (container, { label = 'Progress' } = {}) => {
      const host = typeof container === 'string' ? document.querySelector(container) : container;
      if (!host) throw new Error('Slider container not found');
      scene.prepare();
      const wrapper = document.createElement('label'); wrapper.className = 'rhyform-control';
      const text = document.createElement('span'); text.textContent = label;
      const input = document.createElement('input'); input.type = 'range'; input.min = '0'; input.max = String(scene.duration); input.step = '0.01'; input.value = '0';
      input.setAttribute('aria-label', label);
      const output = document.createElement('output');
      wrapper.append(text, input, output); host.append(wrapper);
      input.addEventListener('input', () => scene.seek(Number(input.value)));
      const update = () => { input.max = String(scene.duration); input.value = scene.currentTime; output.textContent = `${scene.currentTime.toFixed(1)} / ${scene.duration.toFixed(1)} s`; input.setAttribute('aria-valuetext', output.textContent); };
      const unsubscribe = scene.onUpdate(update); update();
      const control = { input, element: wrapper, remove() { unsubscribe(); wrapper.remove(); controls.delete(control); } };
      controls.add(control); return control;
    };
    const observer = new ResizeObserver(() => {
      if (scene.disposed) return;
      viewX.updateGraphZoom(space.name + '-graph', api.libraryFunctions.convertBoundsToViewXBounds(space.camera.bounds));
      for (const object of api.tags['<scene>' + scene.name] || []) if (object instanceof Shape) object.render(object.asset);
    });
    observer.observe(space.element);
    const dispose = scene.dispose;
    scene.dispose = () => { if (scene.disposed) return; observer.disconnect(); for (const control of controls) control.remove(); dispose(); space.element.remove(); delete api.spaces[space.name]; delete viewX.graphData[space.name + '-graph']; };
    return scene;
  };
}
