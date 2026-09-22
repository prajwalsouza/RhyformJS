import svgpath from 'svgpath';

const NS = 'http://www.w3.org/2000/svg';
const number = (value, fallback = 0) => value == null || value === '' ? fallback : Number(value);
export const clamp = value => Math.max(0, Math.min(1, value));
export const mix = (a, b, t) => a + (b - a) * t;
export function finite(value, label = 'value') {
  if (!Number.isFinite(value)) throw new TypeError(`${label} must be finite`);
  return value;
}
export function duration(value) {
  finite(value, 'duration');
  if (value < 0) throw new RangeError('duration must be non-negative');
  return value;
}
export const svgElement = name => document.createElementNS(NS, name);
const commands = segments => segments.map(s => s.join(' ')).join(' ');

export function splitPath(d) {
  const parsed = svgpath(d).abs().unshort();
  if (parsed.err) throw new Error(`Invalid SVG path: ${parsed.err}`);
  const result = [];
  let segments = [];
  for (const segment of parsed.segments) {
    if (segment[0] === 'M' && segments.length) { result.push(segments); segments = []; }
    segments.push(segment);
  }
  if (segments.length) result.push(segments);
  return result.map(s => ({ d: commands(s), closed: s.at(-1)[0].toUpperCase() === 'Z' }));
}

export function samplePath(d, count = 192) {
  const contours = splitPath(d);
  if (contours.length > 128) throw new Error('A path may contain at most 128 contours');
  return contours.map(contour => {
    const element = svgElement('path');
    element.setAttribute('d', contour.d);
    const length = finite(element.getTotalLength(), 'path length');
    const n = Math.max(2, Math.min(512, count));
    const points = Array.from({ length: n }, (_, i) => {
      const p = element.getPointAtLength(length * i / (contour.closed ? n : n - 1));
      return { x: finite(p.x), y: finite(p.y) };
    });
    return { ...contour, length, points };
  });
}

function shapePath(node) {
  const n = key => number(node.getAttribute(key));
  switch (node.localName) {
    case 'path': return node.getAttribute('d') || '';
    case 'line': return `M${n('x1')} ${n('y1')}L${n('x2')} ${n('y2')}`;
    case 'polyline': case 'polygon': {
      const values = (node.getAttribute('points') || '').trim().split(/[\s,]+/).map(Number);
      if (values.length < 4 || values.length % 2 || !values.every(Number.isFinite)) throw new Error('Invalid SVG polygon points');
      return `M${values[0]} ${values[1]} ${values.slice(2).join(' ')}${node.localName === 'polygon' ? 'Z' : ''}`;
    }
    case 'circle': case 'ellipse': {
      const x = n('cx'), y = n('cy'), rx = node.localName === 'circle' ? n('r') : n('rx');
      const ry = node.localName === 'circle' ? rx : n('ry');
      if (rx < 0 || ry < 0) throw new Error('SVG radii must be non-negative');
      return `M${x + rx} ${y}A${rx} ${ry} 0 1 1 ${x - rx} ${y}A${rx} ${ry} 0 1 1 ${x + rx} ${y}Z`;
    }
    case 'rect': {
      const x = n('x'), y = n('y'), w = n('width'), h = n('height');
      if (w < 0 || h < 0) throw new Error('SVG dimensions must be non-negative');
      const rx = Math.max(0, Math.min(w / 2, number(node.getAttribute('rx'), n('ry'))));
      const ry = Math.max(0, Math.min(h / 2, number(node.getAttribute('ry'), rx)));
      if (!rx || !ry) return `M${x} ${y}h${w}v${h}h${-w}Z`;
      return `M${x + rx} ${y}H${x + w - rx}A${rx} ${ry} 0 0 1 ${x + w} ${y + ry}V${y + h - ry}A${rx} ${ry} 0 0 1 ${x + w - rx} ${y + h}H${x + rx}A${rx} ${ry} 0 0 1 ${x} ${y + h - ry}V${y + ry}A${rx} ${ry} 0 0 1 ${x + rx} ${y}Z`;
    }
    default: return null;
  }
}

function inheritedStyle(node, parent) {
  const result = { ...parent };
  const inline = Object.fromEntries((node.getAttribute('style') || '').split(';').filter(Boolean).map(s => {
    const colon = s.indexOf(':'); return [s.slice(0, colon).trim(), s.slice(colon + 1).trim()];
  }));
  for (const prop of ['fill', 'stroke', 'fill-rule', 'stroke-width', 'fill-opacity', 'stroke-opacity', 'color', 'display', 'visibility', 'stroke-linecap', 'stroke-linejoin', 'stroke-miterlimit']) {
    const value = inline[prop] ?? node.getAttribute(prop);
    if (value != null) result[prop] = value;
  }
  result.opacity = parent.opacity * number(inline.opacity ?? node.getAttribute('opacity'), 1);
  for (const prop of ['clip-path', 'mask', 'filter']) {
    if ((inline[prop] ?? node.getAttribute(prop) ?? 'none') !== 'none') throw new Error(`SVG ${prop} is not supported for morphing; flatten it first`);
  }
  for (const prop of ['stroke-dasharray', 'vector-effect']) {
    if ((inline[prop] ?? node.getAttribute(prop) ?? 'none') !== 'none') throw new Error(`SVG ${prop} is not supported for morphing; convert strokes to outlines`);
  }
  if (inline.transform) throw new Error('Use SVG transform attributes instead of CSS transforms');
  if (number(inline.opacity ?? node.getAttribute('opacity'), 1) !== 1 && node.children.length > 1) throw new Error('Group opacity with multiple children must be flattened before import');
  for (const prop of ['fill', 'stroke']) {
    if (result[prop] === 'currentColor') result[prop] = result.color;
    if (/url\s*\(/i.test(result[prop])) throw new Error('SVG paint servers (gradients/patterns) are not supported for morphing yet');
  }
  if (result['fill-rule'] !== 'nonzero' && result['fill-rule'] !== 'evenodd') throw new Error('Unsupported SVG fill rule');
  return result;
}

// Read an inert XML document. Never insert imported SVG, scripts, or event handlers into the page.
export function parseSVG(source, { samples = 192, maxPaths = 256 } = {}) {
  if (typeof source !== 'string' || source.length > 2_000_000) throw new Error('SVG must be a string under 2 MB');
  const doc = new DOMParser().parseFromString(source, 'image/svg+xml');
  const root = doc.documentElement;
  if (doc.querySelector('parsererror') || root.localName !== 'svg') throw new Error('Invalid SVG document');
  const paths = [];
  const initial = { fill: '#000000', stroke: 'none', 'stroke-width': '1', 'fill-rule': 'nonzero', 'fill-opacity': '1', 'stroke-opacity': '1', 'stroke-linecap': 'butt', 'stroke-linejoin': 'miter', 'stroke-miterlimit': '4', opacity: 1, color: '#000000' };
  function visit(node, transforms, parentStyle, stack = [], context = {}) {
    if (node.nodeType !== 1) return;
    const type = node.localName;
    const mml = node.getAttribute('data-mml-node');
    context = { ...context, glyph: node.getAttribute('data-c') || context.glyph, key: node.getAttribute('data-key') || context.key };
    if (['mi', 'mn', 'mo'].includes(mml)) context.mathType = mml;
    if (['defs', 'title', 'desc', 'metadata'].includes(type)) return;
    if (['script', 'style', 'foreignObject', 'image', 'text', 'filter', 'mask', 'clipPath', 'animate', 'animateTransform', 'set'].includes(type)) throw new Error(`SVG <${type}> is not supported; import geometric paths`);
    const style = inheritedStyle(node, parentStyle);
    if (style.display === 'none' || style.visibility === 'hidden') return;
    const transform = [...transforms, node.getAttribute('transform') || ''];
    if (type === 'use') {
      const href = node.getAttribute('href') || node.getAttribute('xlink:href');
      if (!href?.startsWith('#')) throw new Error('SVG use must reference a local ID');
      const target = doc.getElementById(href.slice(1));
      if (!target || stack.includes(target) || stack.length > 24) throw new Error('Invalid or circular SVG use reference');
      visit(target, [...transform, `translate(${number(node.getAttribute('x'))} ${number(node.getAttribute('y'))})`], style, [...stack, target], context);
      return;
    }
    if (type === 'svg' && node !== root) throw new Error('Nested SVG viewports are not supported; flatten their viewBox transforms first');
    const d = shapePath(node);
    if (d !== null && d.trim()) {
      if (paths.length >= maxPaths) throw new Error(`SVG exceeds ${maxPaths} paths`);
      const parsed = svgpath(d).transform(transform.join(' ')).abs();
      if (parsed.err) throw new Error(`Invalid SVG path: ${parsed.err}`);
      const transformed = parsed.toString();
      const basis = svgpath('M0 0L1 0L0 1').transform(transform.join(' '));
      basis.toString();
      const [o, a, b] = basis.segments;
      const ux = a[1] - o[1], uy = a[2] - o[2], vx = b[1] - o[1], vy = b[2] - o[2];
      const scale = Math.hypot(ux, uy), scaleY = Math.hypot(vx, vy);
      if (style.stroke !== 'none' && (Math.abs(scale - scaleY) > 1e-6 || Math.abs(ux * vx + uy * vy) > 1e-6)) throw new Error('Non-uniform SVG stroke transforms require outlined strokes');
      const contours = samplePath(transformed, samples);
      if (contours.length + paths.reduce((n, p) => n + p.contours.length, 0) > 1024) throw new Error('SVG exceeds 1024 contours');
      const glyph = context.glyph || (type === 'rect' && node.closest('[data-mml-node]') ? 'rule' : null);
      paths.push({ id: context.key || '', glyph, mathType: glyph === 'rule' ? 'rule' : context.mathType, mathRole: context.mathRole || '', d: transformed, contours, fill: style.fill, stroke: style.stroke, fillRule: style['fill-rule'], strokeWidth: finite(number(style['stroke-width']), 'stroke width') * scale, linecap: style['stroke-linecap'], linejoin: style['stroke-linejoin'], miterlimit: finite(number(style['stroke-miterlimit'])), opacity: finite(style.opacity), fillOpacity: finite(number(style['fill-opacity'])), strokeOpacity: finite(number(style['stroke-opacity'])) });
    } else if (['g', 'svg', 'a'].includes(type)) {
      [...node.children].forEach((child, i) => {
        const roles = { mfrac: ['numerator', 'denominator', 'bar'], msup: ['base', 'exponent'], msub: ['base', 'subscript'], msubsup: ['base', 'subscript', 'exponent'] };
        const role = roles[mml]?.[i];
        visit(child, transform, style, stack, role ? { ...context, mathRole: [context.mathRole, role].filter(Boolean).join('/') } : context);
      });
    } else if (d === null) throw new Error(`SVG <${type}> is not supported`);
  }
  visit(root, [], initial);
  if (!paths.length) throw new Error('SVG contains no drawable geometry');
  const values = (root.getAttribute('viewBox') || '').trim().split(/[\s,]+/).map(Number);
  const viewBox = values.length === 4 && values.every(Number.isFinite) && values[2] > 0 && values[3] > 0 ? values : null;
  let xmin = Infinity, ymin = Infinity, xmax = -Infinity, ymax = -Infinity;
  for (const path of paths) for (const contour of path.contours) for (const p of contour.points) {
    xmin = Math.min(xmin, p.x); ymin = Math.min(ymin, p.y);
    xmax = Math.max(xmax, p.x); ymax = Math.max(ymax, p.y);
  }
  const bounds = viewBox || [xmin, ymin, xmax - xmin, ymax - ymin];
  return { paths, bounds, samples };
}

export function fitAsset(asset, { width = 4, at = { x: 0, y: 0 }, centered = false, color, fill } = {}) {
  finite(width, 'width'); if (width <= 0) throw new Error('width must be positive');
  const [x, y, w, h] = asset.bounds;
  const scale = width / (w || 1);
  const ox = finite(at.x ?? at[0] ?? 0), oy = finite(at.y ?? at[1] ?? 0);
  const tx = ox - (x + (centered ? w / 2 : 0)) * scale;
  const ty = oy + (y + (centered ? h / 2 : 0)) * scale;
  const paths = asset.paths.map(path => {
    const d = svgpath(path.d).matrix([scale, 0, 0, -scale, tx, ty]).toString();
    return { ...path, d, contours: samplePath(d, asset.samples), strokeWidth: path.strokeWidth * scale, ...(color ? { stroke: color } : {}), ...(fill ? { fill } : {}) };
  });
  return { paths, bounds: [ox - (centered ? width / 2 : 0), oy - h * scale * (centered ? .5 : 1), width, h * scale], samples: asset.samples };
}

export function contoursToCommands(contours) {
  return contours.flatMap(c => [...c.points, ...(c.closed ? [c.points[0]] : [])].map((p, i) => ({ command: i ? 'L' : 'M', x: p.x, y: p.y })));
}
export function pointsPath(contours) {
  return contours.map(c => c.points.map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`).join(' ') + (c.closed ? 'Z' : '')).join(' ');
}
const area = c => c.points.reduce((sum, p, i) => { const q = c.points[(i + 1) % c.points.length]; return sum + p.x * q.y - p.y * q.x; }, 0);
const center = points => ({ x: points.reduce((s, p) => s + p.x, 0) / points.length, y: points.reduce((s, p) => s + p.y, 0) / points.length });
function nesting(contours, fillRule) {
  function inside(p, polygon) {
    let contained = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const a = polygon[i], b = polygon[j];
      if ((a.y > p.y) !== (b.y > p.y) && p.x < (b.x - a.x) * (p.y - a.y) / (b.y - a.y) + a.x) contained = !contained;
    }
    return contained;
  }
  return contours.map((c, i) => {
    if (!c.closed) return 'open';
    let parent = -1;
    for (let j = 0; j < i; j++) if (contours[j].closed && inside(c.points[0], contours[j].points)) parent = j;
    return `${parent}:${fillRule === 'nonzero' && parent >= 0 ? Math.sign(area(c)) * Math.sign(area(contours[parent])) : 0}`;
  }).join('|');
}
function align(a, b, closed) {
  let target = b.slice();
  if (!closed) return target;
  if (Math.sign(area({ points: a })) !== Math.sign(area({ points: b }))) target.reverse();
  const ca = center(a), cb = center(target);
  let best = 0, bestScore = Infinity;
  for (let offset = 0; offset < a.length; offset++) {
    let score = 0;
    for (let i = 0; i < a.length; i++) {
      const p = target[(i + offset) % a.length];
      score += (a[i].x - ca.x - p.x + cb.x) ** 2 + (a[i].y - ca.y - p.y + cb.y) ** 2;
    }
    if (score < bestScore) { bestScore = score; best = offset; }
  }
  return target.map((_, i) => target[(i + best) % target.length]);
}
const colors = new Map();
export function rgba(value) {
  if (value === 'none' || value === 'transparent') return [0, 0, 0, 0];
  if (colors.has(value)) return colors.get(value);
  if (!CSS.supports('color', value)) throw new Error(`Invalid color: ${value}`);
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1;
  const ctx = canvas.getContext('2d', { willReadFrequently: true }); ctx.fillStyle = value; ctx.fillRect(0, 0, 1, 1);
  const data = [...ctx.getImageData(0, 0, 1, 1).data]; data[3] /= 255; colors.set(value, data); return data;
}
export function colorMix(a, b, t) {
  if (a === b) return a;
  const left = rgba(a).slice(), right = rgba(b).slice();
  if (!left[3]) left.splice(0, 3, ...right.slice(0, 3));
  if (!right[3]) right.splice(0, 3, ...left.slice(0, 3));
  return `rgba(${left.slice(0, 3).map((v, i) => Math.round(mix(v, right[i], t))).join(',')},${mix(left[3], right[3], t)})`;
}

export function prepareMorph(source, target, { fallback = 'error' } = {}) {
  let compatible = source.paths.length === target.paths.length;
  const targets = source.paths.map((p, i) => p.id ? target.paths.find(q => q.id === p.id) : target.paths[i]);
  compatible &&= targets.every(Boolean) && new Set(targets).size === targets.length;
  const pairs = compatible ? source.paths.map((a, i) => {
    const b = targets[i];
    const ac = samplePath(a.d).sort((x, y) => Math.abs(area(y)) - Math.abs(area(x)));
    const bc = samplePath(b.d).sort((x, y) => Math.abs(area(y)) - Math.abs(area(x)));
    if (ac.length !== bc.length || ac.some((c, j) => c.closed !== bc[j].closed) || a.fillRule !== b.fillRule || nesting(ac, a.fillRule) !== nesting(bc, b.fillRule)) { compatible = false; return null; }
    return { a, b, contours: ac.map((c, j) => ({ a: c.points, b: align(c.points, bc[j].points, c.closed), closed: c.closed })) };
  }) : [];
  if (!compatible && fallback !== 'crossfade') throw new Error('These SVGs have different contour topology or keys. Supply matching contours, or opt into { fallback: "crossfade" }.');
  return {
    strategy: compatible ? 'contour-morph' : 'crossfade',
    sample(progress) {
      const t = clamp(progress);
      if (t === 0) return source;
      if (t === 1) return target;
      if (!compatible) return { paths: [...source.paths.map(p => ({ ...p, opacity: p.opacity * (1 - t) })), ...target.paths.map(p => ({ ...p, opacity: p.opacity * t }))] };
      return { paths: pairs.map(({ a, b, contours }) => ({ ...a, d: pointsPath(contours.map(c => ({ closed: c.closed, points: c.a.map((p, i) => ({ x: mix(p.x, c.b[i].x, t), y: mix(p.y, c.b[i].y, t) })) }))), fill: colorMix(a.fill, b.fill, t), stroke: colorMix(a.stroke, b.stroke, t), strokeWidth: mix(a.strokeWidth, b.strokeWidth, t), opacity: mix(a.opacity, b.opacity, t), fillOpacity: mix(a.fillOpacity, b.fillOpacity, t), strokeOpacity: mix(a.strokeOpacity, b.strokeOpacity, t) })) };
    }
  };
}
