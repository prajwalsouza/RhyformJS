import svgpath from 'svgpath';
import { prepareMorph, clamp } from './svg.js';

// MathJax supplies glyph identities. Proximity breaks ties between repeated
// glyphs; this is visual correspondence, not a symbolic algebra solver.
export function prepareGlyphMorph(source, target) {
  if (source.kind !== 'equation' || target.kind !== 'equation') throw new Error('match: "glyphs" requires two equation descriptors');
  const position = (path, asset) => {
    const points = path.contours.flatMap(c => c.points);
    const x = points.reduce((v, p) => v + p.x, 0) / points.length;
    const y = points.reduce((v, p) => v + p.y, 0) / points.length;
    return [(x - asset.bounds[0]) / asset.bounds[2], (y - asset.bounds[1]) / (asset.bounds[3] || 1)];
  };
  const a = source.paths.map(p => position(p, source)), b = target.paths.map(p => position(p, target));
  const candidates = [];
  source.paths.forEach((p, i) => target.paths.forEach((q, j) => {
    if (p.glyph && p.glyph === q.glyph) candidates.push({ i, j, distance: (a[i][0] - b[j][0]) ** 2 + (a[i][1] - b[j][1]) ** 2 });
  }));
  candidates.sort((a, b) => a.distance - b.distance || a.i - b.i || a.j - b.j);
  const usedA = new Set(), usedB = new Set(), pairs = [];
  for (const { i, j } of candidates) {
    if (usedA.has(i) || usedB.has(j)) continue;
    let plan;
    try { plan = prepareMorph({ paths: [source.paths[i]] }, { paths: [target.paths[j]] }); }
    catch { continue; } // A different font/contour structure enters and leaves.
    usedA.add(i); usedB.add(j); pairs.push(plan);
  }
  const leaving = source.paths.filter((_, i) => !usedA.has(i)), entering = target.paths.filter((_, i) => !usedB.has(i));
  return {
    strategy: 'glyph-match',
    correspondence: { matched: pairs.length, entering: entering.length, leaving: leaving.length },
    sample(progress) {
      const t = clamp(progress);
      if (t === 0) return source;
      if (t === 1) return target;
      return { paths: [
        ...pairs.flatMap(plan => plan.sample(t).paths),
        ...leaving.map(p => ({ ...p, opacity: p.opacity * (1 - t) })),
        ...entering.map(p => ({ ...p, opacity: p.opacity * t }))
      ] };
    }
  };
}

// Minimum-cost one-to-one assignment, including explicit birth/death slots.
// A global assignment avoids a greedy repeated-glyph match stealing the best
// destination from a neighbouring term.
function assignment(cost) {
  const n = cost.length, u = Array(n + 1).fill(0), v = Array(n + 1).fill(0), p = Array(n + 1).fill(0), way = Array(n + 1).fill(0);
  for (let i = 1; i <= n; i++) {
    p[0] = i;
    let j0 = 0;
    const min = Array(n + 1).fill(Infinity), used = Array(n + 1).fill(false);
    do {
      used[j0] = true;
      const i0 = p[j0];let delta = Infinity, j1 = 0;
      for (let j = 1; j <= n; j++) if (!used[j]) {
        const next = cost[i0 - 1][j - 1] - u[i0] - v[j];
        if (next < min[j]) { min[j] = next;way[j] = j0; }
        if (min[j] < delta) { delta = min[j];j1 = j; }
      }
      for (let j = 0; j <= n; j++) {
        if (used[j]) { u[p[j]] += delta;v[j] -= delta; } else min[j] -= delta;
      }
      j0 = j1;
    } while (p[j0] !== 0);
    do { const j1 = way[j0];p[j0] = p[j1];j0 = j1; } while (j0 !== 0);
  }
  const result = Array(n);for (let j = 1; j <= n; j++) result[p[j] - 1] = j - 1;return result;
}

function features(path, asset) {
  const points = path.contours.flatMap(c => c.points);
  const xs = points.map(p => p.x), ys = points.map(p => p.y);
  const x = Math.min(...xs), y = Math.min(...ys), w = Math.max(...xs) - x, h = Math.max(...ys) - y;
  const center = { x: x + w / 2, y: y + h / 2 };
  // Coarse shape signature, normalized for size and location. Exact contour
  // compatibility is checked by prepareMorph before a reshape is accepted.
  const signature = Array.from({ length: 16 }, (_, i) => {
    const p = points[Math.floor(i * points.length / 16)];
    return [(p.x - center.x) / (w || 1), (p.y - center.y) / (h || 1)];
  });
  return { center, signature, position: [(center.x - asset.bounds[0]) / asset.bounds[2], (center.y - asset.bounds[1]) / (asset.bounds[3] || 1)] };
}

function operatorFamily(glyph) {
  if (['2B', '2212', 'B1', '2213', 'D7', '22C5', 'F7'].includes(glyph)) return 'arithmetic';
  if (['3D', '2260', '2248', '2264', '2265', '3C', '3E', '2208', '2209'].includes(glyph)) return 'relation';
  if (['28', '29', '5B', '5D', '7B', '7D', '7C'].includes(glyph)) return 'delimiter';
  return glyph; // Unknown operators only map by identity.
}

export function prepareSemanticMorph(source, target) {
  if (source.kind !== 'equation' || target.kind !== 'equation') throw new Error('match: "semantic" requires two equation descriptors');
  const left = source.paths, right = target.paths, n = left.length, m = right.length;
  const a = left.map(p => features(p, source)), b = right.map(p => features(p, target));
  const distance = (a, b) => Math.hypot(a.position[0] - b.position[0], a.position[1] - b.position[1]);
  const pairCost = (i, j) => {
    const p = left[i], q = right[j];
    const sameGlyph = p.glyph && p.glyph === q.glyph;
    if (!sameGlyph && (!p.mathType || p.mathType !== q.mathType || p.contours.length !== q.contours.length)) return 1e6;
    if (!sameGlyph && p.mathType === 'mo' && operatorFamily(p.glyph) !== operatorFamily(q.glyph)) return 1e6;
    const shape = a[i].signature.reduce((sum, xy, k) => sum + Math.hypot(xy[0] - b[j].signature[k][0], xy[1] - b[j].signature[k][1]), 0) / 16;
    return (sameGlyph ? 0 : 2.8 + shape) + (p.mathRole === q.mathRole ? 0 : .8) + distance(a[i], b[j]);
  };
  const cost = Array.from({ length: n + m }, (_, i) => Array.from({ length: n + m }, (_, j) => {
    if (i < n && j < m) return pairCost(i, j);
    if (i < n) return j - m === i ? 2.5 : 1e6;
    if (j < m) return i - n === j ? 2.5 : 1e6;
    return 0;
  }));
  const map = assignment(cost), pairs = [], usedA = new Set(), usedB = new Set();
  for (let i = 0; i < n; i++) {
    const j = map[i];if (j >= m || cost[i][j] >= 1e6) continue;
    try {
      const plan = prepareMorph({ paths: [left[i]] }, { paths: [right[j]] });
      pairs.push({ i, j, plan });usedA.add(i);usedB.add(j);
    } catch { /* Incompatible holes use geometric birth/death, never a dissolve. */ }
  }
  const related = (path, info, candidates, candidateInfo) => {
    let best = 0, score = Infinity;
    candidates.forEach((p, i) => {
      const next = (p.glyph === path.glyph ? 0 : p.mathType === path.mathType ? 1 : 2) + (p.mathRole === path.mathRole ? 0 : .5) + distance(info, candidateInfo[i]);
      if (next < score) { score = next;best = i; }
    });
    return candidateInfo[best].center;
  };
  const leaving = left.map((path, i) => ({ path, i })).filter(p => !usedA.has(p.i)).map(({ path, i }) => ({ path, anchor: related(path, a[i], right, b) }));
  const entering = right.map((path, j) => ({ path, j })).filter(p => !usedB.has(p.j)).map(({ path, j }) => ({ path, anchor: related(path, b[j], left, a) }));
  const scaled = ({ path, anchor }, scale) => ({ ...path, d: svgpath(path.d).matrix([scale, 0, 0, scale, anchor.x * (1 - scale), anchor.y * (1 - scale)]).toString(), strokeWidth: path.strokeWidth * scale });
  return {
    strategy: 'semantic-match',
    correspondence: {
      matched: pairs.length, reshaped: pairs.filter(({ i, j }) => left[i].glyph !== right[j].glyph).length,
      entering: entering.length, leaving: leaving.length,
      pairs: pairs.map(({ i, j }) => ({ from: i, to: j, sourceGlyph: left[i].glyph, targetGlyph: right[j].glyph }))
    },
    sample(progress) {
      const t = clamp(progress);
      if (t === 0) return source;if (t === 1) return target;
      const out = 1 - clamp(t / .55), into = clamp((t - .45) / .55);
      return { paths: [
        ...pairs.flatMap(({ plan }) => plan.sample(t).paths),
        ...(out > 0 ? leaving.map(p => scaled(p, out)) : []),
        ...(into > 0 ? entering.map(p => scaled(p, into)) : [])
      ] };
    }
  };
}
