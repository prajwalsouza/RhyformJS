// Shared vocabulary for "The Statistical Geometry of Invisible Causes".
// Every shape here is an ordinary Rhyform descriptor with a fixed sample grid,
// so it can be drawn, morphed with transformTo, or rebuilt live from sliders.

export const TAU = Math.PI * 2;
export const palette = {
  night: "#0c1215",
  paper: "#eeeee3",
  chalk: "#c9cfc6",
  mint: "#8fd6b4",
  amber: "#f0bf68",
  coral: "#e98a6f",
  sky: "#86b6e8",
  violet: "#b59ce6",
  rose: "#e59ab4",
  slate: "#2c3a3f",
  dim: "#56656a",
  ghost: "#3d4f55",
};

export const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const ease = (t) => t * t * (3 - 2 * t);
export const mix = (a, b, t) => a + (b - a) * t;
export const add = (a, b) => a.map((x, i) => x + b[i]);
export const sub = (a, b) => a.map((x, i) => x - b[i]);
export const mul = (a, s) => a.map((x) => x * s);
export const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
export const len = (a) => Math.hypot(...a);
export const lerp3 = (a, b, t) => a.map((x, i) => mix(x, b[i], t));
export const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
export const unit = (a) => {
  const l = len(a);
  return l < 1e-9 ? [0, 1, 0] : mul(a, 1 / l);
};
function basis(d) {
  const a = Math.abs(d[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  const e1 = unit(cross(d, a));
  return [e1, cross(d, e1)];
}

// Deterministic randomness, so every reader sees the same "random" data.
export function random(seed = 1) {
  let s = seed >>> 0;
  const next = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  next.normal = () => {
    const u = Math.max(1e-12, next()),
      v = next();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v);
  };
  return next;
}

// ---------------------------------------------------------------- shapes

// A ball in the p-norm: p = 1 is a diamond, 2 a sphere, Infinity a cube.
export function ball(center, radius, { p = 2, u = 32, v = 16, ...style } = {}) {
  return {
    type: "surface",
    u: [0, 1],
    v: [0, 1],
    uSegments: u,
    vSegments: v,
    fn(s, t) {
      const lat = (t - 0.5) * Math.PI,
        d = [
          Math.cos(TAU * s) * Math.cos(lat),
          Math.sin(lat),
          Math.sin(TAU * s) * Math.cos(lat),
        ];
      const n =
        p === Infinity
          ? Math.max(...d.map(Math.abs))
          : Math.pow(d.reduce((a, x) => a + Math.abs(x) ** p, 0), 1 / p);
      return add(center, mul(d, radius / Math.max(n, 1e-9)));
    },
    ...style,
  };
}

// A crisp closed box. Duplicate rows and columns keep hard edges when normals are computed.
export function box(min, max, style = {}) {
  const [x0, y0, z0] = min,
    [x1, y1, z1] = max;
  const corners = [
    [x0, z0],
    [x1, z0],
    [x1, z1],
    [x0, z1],
  ];
  const cx = (x0 + x1) / 2,
    cz = (z0 + z1) / 2;
  return {
    type: "surface",
    u: [0, 7],
    v: [0, 5],
    uSegments: 7,
    vSegments: 5,
    fn(a, b) {
      const i = Math.round(a),
        j = Math.round(b);
      const side = Math.floor(i / 2),
        c = corners[(side + (i % 2)) % 4];
      if (j === 0) return [cx, y0, cz];
      if (j === 5) return [cx, y1, cz];
      return [c[0], j <= 2 ? y0 : y1, c[1]];
    },
    ...style,
  };
}

// One mesh arrow: a revolved shaft and head along any direction.
export function arrow(
  from,
  to,
  { radius = 0.045, head = 0.3, headRadius = 0.12, v = 14, ...style } = {},
) {
  const d = sub(to, from),
    L = len(d),
    dir = unit(d),
    [e1, e2] = basis(dir);
  const h = Math.min(head, L * 0.55),
    r = Math.min(radius, headRadius * 0.6) * (L < 1e-6 ? 0 : 1),
    hr = headRadius * (h / head) * (L < 1e-6 ? 0 : 1);
  const profile = [
    [0, 0],
    [0, r],
    [0, r],
    [L - h, r],
    [L - h, r],
    [L - h, hr],
    [L - h, hr],
    [L, 0],
  ];
  return {
    type: "surface",
    u: [0, 7],
    v: [0, 1],
    uSegments: 7,
    vSegments: v,
    fn(a, b) {
      const [z, rho] = profile[Math.round(a)],
        angle = TAU * b;
      return add(
        add(from, mul(dir, z)),
        add(mul(e1, rho * Math.cos(angle)), mul(e2, rho * Math.sin(angle))),
      );
    },
    ...style,
  };
}

// Up to 64 small beads in one surface. Each bead runs pole to pole; the zero-area
// strip joining one bead's north pole to the next bead's south pole is invisible.
export const CLOUD_LIMIT = 64;
export function cloud(points, radius = 0.06, style = {}) {
  const n = points.length;
  if (!n || n > CLOUD_LIMIT) throw Error(`A cloud holds 1-${CLOUD_LIMIT} points`);
  const radii =
    typeof radius === "number" ? points.map(() => radius) : radius.slice();
  const rows = [-1, -0.42, 0.42, 1];
  return {
    type: "surface",
    u: [0, 4 * n - 1],
    v: [0, 1],
    uSegments: 4 * n - 1,
    vSegments: 6,
    fn(a, b) {
      const i = Math.round(a),
        k = Math.floor(i / 4),
        y = rows[i % 4],
        ring = Math.sqrt(Math.max(0, 1 - y * y)),
        r = radii[k],
        c = points[k];
      return [
        c[0] + r * ring * Math.cos(TAU * b),
        c[1] + r * y,
        c[2] + r * ring * Math.sin(TAU * b),
      ];
    },
    ...style,
  };
}

export const segment = (from, to, style = {}) => ({
  type: "line",
  from,
  to,
  segments: 2,
  ...style,
});
export const polyline = (points, style = {}) => ({
  type: "path",
  points,
  segments: Math.max(2, (points.length - 1) * 4),
  ...style,
});
export function curve(fn, range = [0, 1], segments = 96, style = {}) {
  return { type: "curve", fn, range, segments, ...style };
}

// A lattice of lines as one continuous path; every connecting move retraces a border line.
// origin is a corner; u and v are the step vectors; nu × nv cells.
export function lattice(origin, u, v, nu, nv, style = {}) {
  const P = (i, j) => add(origin, add(mul(u, i), mul(v, j)));
  const pts = [];
  for (let j = 0; j <= nv; j++)
    pts.push(...(j % 2 ? [P(nu, j), P(0, j)] : [P(0, j), P(nu, j)]));
  const atRight = nv % 2 === 0;
  for (let k = 0; k <= nu; k++) {
    const i = atRight ? nu - k : k;
    pts.push(...(k % 2 ? [P(i, 0), P(i, nv)] : [P(i, nv), P(i, 0)]));
  }
  return {
    type: "path",
    points: pts,
    segments: pts.length - 1,
    lineWidth: 1,
    ...style,
  };
}
export function grid(xRange, zRange, step = 1, y = 0, style = {}) {
  const nu = Math.round((xRange[1] - xRange[0]) / step),
    nv = Math.round((zRange[1] - zRange[0]) / step);
  return lattice([xRange[0], y, zRange[0]], [step, 0, 0], [0, 0, step], nu, nv, style);
}

// XYZ Euler angles (degrees) that turn a flat object's +Z face toward a direction.
export function faceToward(direction) {
  const d = unit(direction),
    a = Math.atan2(d[0], d[2]),
    b = -Math.asin(clamp(d[1], -1, 1));
  const deg = (r) => (r * 180) / Math.PI;
  return [
    deg(Math.atan2(Math.sin(b), Math.cos(a) * Math.cos(b))),
    deg(Math.asin(clamp(Math.sin(a) * Math.cos(b), -1, 1))),
    deg(Math.atan2(-Math.sin(a) * Math.sin(b), Math.cos(a))),
  ];
}

// Rotate a point around an axis through the origin (Rodrigues).
export function rotateAxis(p, axis, angle) {
  const k = unit(axis),
    c = Math.cos(angle),
    s = Math.sin(angle);
  return add(
    add(mul(p, c), mul(cross(k, p), s)),
    mul(k, dot(k, p) * (1 - c)),
  );
}

// An arc of radius r around center, sweeping from direction a toward direction b.
export function arc(center, a, b, r, style = {}) {
  const u = unit(a),
    w = unit(sub(unit(b), mul(u, dot(unit(b), u)))),
    angle = Math.acos(clamp(dot(unit(a), unit(b)), -1, 1));
  return curve(
    (t) => add(center, add(mul(u, r * Math.cos(t)), mul(w, r * Math.sin(t)))),
    [0, Math.max(angle, 1e-4)],
    48,
    style,
  );
}

// A flat quad (two triangles) through four corners, for planes and translucent-looking panels.
export function quad(a, b, c, d, style = {}) {
  return {
    type: "surface",
    u: [0, 1],
    v: [0, 1],
    uSegments: 2,
    vSegments: 2,
    fn: (s, t) => lerp3(lerp3(a, b, s), lerp3(d, c, s), t),
    ...style,
  };
}

// A disc lying in the plane with the given normal.
export function disc(center, normal, radius, style = {}) {
  const [e1, e2] = basis(unit(normal));
  return {
    type: "surface",
    u: [0, 1],
    v: [0, 1],
    uSegments: 4,
    vSegments: 64,
    fn: (s, t) =>
      add(
        center,
        add(
          mul(e1, s * radius * Math.cos(TAU * t)),
          mul(e2, s * radius * Math.sin(TAU * t)),
        ),
      ),
    ...style,
  };
}

// A double cone around an axis through the origin, half-angle theta, reaching length L.
export function doubleCone(axis, theta, L, style = {}) {
  const d = unit(axis),
    [e1, e2] = basis(d),
    r = Math.tan(theta);
  return {
    type: "surface",
    u: [-1, 1],
    v: [0, 1],
    uSegments: 32,
    vSegments: 48,
    fn: (s, t) => {
      const z = s * L,
        rho = Math.abs(z) * r;
      return add(
        mul(d, z),
        add(mul(e1, rho * Math.cos(TAU * t)), mul(e2, rho * Math.sin(TAU * t))),
      );
    },
    ...style,
  };
}

// ---------------------------------------------------------------- statistics

export function lgamma(x) {
  const g = 7,
    c = [
      0.99999999999980993, 676.5203681218851, -1259.1392167224028,
      771.32342877765313, -176.61502916214059, 12.507343278686905,
      -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
    ];
  if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - lgamma(1 - x);
  x -= 1;
  let a = c[0];
  const t = x + g + 0.5;
  for (let i = 1; i < g + 2; i++) a += c[i] / (x + i);
  return 0.5 * Math.log(TAU) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}
export const normalPdf = (x) => Math.exp(-x * x / 2) / Math.sqrt(TAU);
export const laplacePdf = (x, b = 1 / Math.SQRT2) =>
  Math.exp(-Math.abs(x) / b) / (2 * b);
export function tPdf(x, nu) {
  return Math.exp(
    lgamma((nu + 1) / 2) -
      lgamma(nu / 2) -
      0.5 * Math.log(nu * Math.PI) -
      ((nu + 1) / 2) * Math.log(1 + (x * x) / nu),
  );
}
// Two-sided tail probability P(|T| > x) by Simpson integration of the density.
export function tTail(x, nu) {
  const n = 400,
    h = x / n;
  let s = tPdf(0, nu) + tPdf(x, nu);
  for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * tPdf(i * h, nu);
  return clamp(1 - (2 * s * h) / 3, 0, 1);
}
export function correlation(xs, ys) {
  const n = xs.length,
    mx = xs.reduce((a, b) => a + b, 0) / n,
    my = ys.reduce((a, b) => a + b, 0) / n;
  let sxy = 0,
    sxx = 0,
    syy = 0;
  for (let i = 0; i < n; i++) {
    sxy += (xs[i] - mx) * (ys[i] - my);
    sxx += (xs[i] - mx) ** 2;
    syy += (ys[i] - my) ** 2;
  }
  return sxx && syy ? sxy / Math.sqrt(sxx * syy) : 0;
}
export function slope(xs, ys) {
  const n = xs.length,
    mx = xs.reduce((a, b) => a + b, 0) / n,
    my = ys.reduce((a, b) => a + b, 0) / n;
  let sxy = 0,
    sxx = 0;
  for (let i = 0; i < n; i++) {
    sxy += (xs[i] - mx) * (ys[i] - my);
    sxx += (xs[i] - mx) ** 2;
  }
  return { slope: sxx ? sxy / sxx : 0, mx, my };
}
// The constant c minimizing sum |y_i - c|^p (golden section; the loss is convex).
export function pCenter(ys, p) {
  if (p === Infinity) return (Math.min(...ys) + Math.max(...ys)) / 2;
  const loss = (c) => ys.reduce((s, y) => s + Math.abs(y - c) ** p, 0);
  let a = Math.min(...ys),
    b = Math.max(...ys);
  const r = (Math.sqrt(5) - 1) / 2;
  for (let i = 0; i < 90; i++) {
    const c = b - r * (b - a),
      d = a + r * (b - a);
    if (loss(c) < loss(d)) b = d;
    else a = c;
  }
  return (a + b) / 2;
}
export const pDistance = (v, p) =>
  p === Infinity
    ? Math.max(...v.map(Math.abs))
    : Math.pow(v.reduce((s, x) => s + Math.abs(x) ** p, 0), 1 / p);

// ---------------------------------------------------------------- studio

// Wraps a Rhyform 3D scene with the storytelling pieces the page needs:
// named beats, HTML labels pinned to 3D points, a look-at track, and slider panels.
export function studio(stage, options = {}) {
  const camera = options.camera ?? { at: [6, 5, 9], lookAt: [0, 0, 0] };
  const scene = rhyform.scene(stage, {
    dimensions: 3,
    background: palette.night,
    viewHeight: 8,
    ...options,
    camera,
  });
  const beats = [],
    labels = [],
    panels = {},
    looks = [];
  let look = [...camera.lookAt];
  const T = () => scene.currentTime;
  const now = () => {
    scene.prepare();
    return scene.duration;
  };
  // Eased 0→1 progress between two authored times.
  const window = (t0, t1) => () =>
    ease(clamp((scene.currentTime - t0) / Math.max(1e-6, t1 - t0)));
  const kit = {
    scene,
    T,
    now,
    window,
    // A new beat retires the previous beat's labels unless they were marked persistent.
    beat(name) {
      const time = now();
      for (const l of labels) if (l.to === Infinity && !l.persist && l.from <= time) l.to = time;
      beats.push({ name, time });
    },
    hold(seconds) {
      const t0 = now();
      scene.wait(seconds);
      return [t0, t0 + seconds];
    },
    // Moves the camera and, over the same interval, its look-at target.
    cam(at, lookAt = look, seconds = 2) {
      const t0 = now();
      looks.push({ t0, t1: t0 + seconds, from: look, to: [...lookAt] });
      look = [...lookAt];
      return scene.camera.moveTo(at, seconds);
    },
    shape(descriptor) {
      return scene.shape(descriptor);
    },
    live(factory, style = {}) {
      return scene.liveShape(() => ({ ...factory(), ...style }));
    },
    // An HTML label pinned to a 3D point. It fades in when authored and out after end().
    label(html, at, { cls = "", from, to = Infinity, tex = false, persist = false } = {}) {
      const item = {
        html,
        tex,
        persist,
        at,
        cls,
        from: from ?? now(),
        to,
        end(time) {
          item.to = time ?? now();
          return item;
        },
      };
      labels.push(item);
      return item;
    },
    param(name, value, min, max, step, extra = {}) {
      const p = scene.parameter(name, { value, min, max, step });
      Object.assign(p, { initial: value, ...extra });
      return p;
    },
    // Attach sliders, presets and a live readout to the beat authored most recently.
    panel(spec) {
      panels[beats.at(-1).name] = spec;
    },
  };
  scene.onUpdate(() => {
    const t = scene.currentTime;
    let target = [...camera.lookAt];
    for (const k of looks) {
      if (t < k.t0) break;
      target = lerp3(k.from, k.to, ease(clamp((t - k.t0) / (k.t1 - k.t0))));
    }
    scene.camera.lookAt(target);
  });
  kit.finish = () => {
    scene.prepare();
    const list = beats.map((b, i) => ({
      ...b,
      start: b.time,
      end: beats[i + 1]?.time ?? scene.duration,
    }));
    scene.seek(0);
    return { scene, beats: list, labels, panels };
  };
  return kit;
}
