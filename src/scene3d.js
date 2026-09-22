import { Quaternion, Euler, Vector3 } from "three";
import { parseSVG, fitAsset, prepareMorph } from "./svg.js";
import { prepareSemanticMorph } from "./math-morph.js";
import { compileVector, vectorAsset } from "./vector3d.js";
import {
  compileGeometry,
  prepareGeometryMorph,
  describe,
  vector,
  positive,
  geometryNames,
} from "./geometry3d.js";
import { createThreeRenderer, parseColor } from "./renderers/three.js";
import { installTimeline } from "./timeline.js";
import { installSceneControls } from "./controls.js";
import { createTagTree, selectTag, tagPath } from "./tags3d.js";
import { duration, finite, mix } from "./numeric.js";

const smooth = (t) => t * t * (3 - 2 * t);
const optionsFor = (value) =>
  typeof value === "number" ? { duration: value } : (value ?? {});
const degrees = (value) =>
  new Quaternion().setFromEuler(
    new Euler(...vector(value, "rotation").map((n) => (n * Math.PI) / 180)),
  );
const scaleVector = (value) =>
  (typeof value === "number"
    ? [value, value, value]
    : vector(value, "scale")
  ).map((n) => positive(n, "scale"));
let serial = 0;

export function createScene3D(selector, options = {}, assets) {
  const host =
    typeof selector === "string" ? document.querySelector(selector) : selector;
  if (!host?.append) throw Error("Scene container not found");
  const objects = new Set(),
    sliders = new Set();
  let sampling = false,
    dirty = true,
    pending = null,
    clearing = false;
  const scene = {
    name: options.name ?? `scene3d-${serial++}`,
    dimensions: 3,
    animations: {},
    animationAdditionIndex: 0,
    animationIndices: [],
    pendingAssets: new Set(),
  };
  const renderer = createThreeRenderer(host, {
    ...options,
    onContextLost() {
      scene.pause();
    },
    onContextRestored() {
      invalidate();
    },
  });
  function flush() {
    if (sampling || clearing || scene.disposed) return;
    if (pending !== null) {
      cancelAnimationFrame(pending);
      pending = null;
    }
    for (const object of objects) if (object.resolve()) dirty = true;
    if (dirty) {
      renderer.render(objects);
      dirty = false;
    }
  }
  function invalidate() {
    dirty = true;
    if (!sampling && !clearing && !scene.disposed && pending === null)
      pending = requestAnimationFrame(() => {
        pending = null;
        flush();
      });
  }
  function clip(sample, value, label) {
    if (scene.disposed) throw Error("Scene is disposed");
    const opts = optionsFor(value),
      seconds = duration(opts.duration ?? 1);
    const animation = {
      name: `3d-${scene.animationAdditionIndex++}`,
      type: "custom",
      duration: seconds,
      label,
      animationOptions: { sample },
      animateNextImmediately: false,
      startNextImmediately() {
        this.animateNextImmediately = true;
        scene.invalidate();
        return this;
      },
    };
    scene.animations[animation.name] = animation;
    scene.invalidate();
    return animation;
  }
  installTimeline(scene, {
    beginSample() {
      sampling = true;
    },
    endSample() {
      sampling = false;
      dirty = true;
      flush();
    },
    abortSample() {
      sampling = false;
      dirty = true;
    },
    clear() {
      clearing = true;
      for (const object of [...objects]) object.remove();
      for (const slider of [...sliders]) slider.remove();
      clearing = false;
      invalidate();
    },
    dispose() {
      observer.disconnect();
      if (pending !== null) cancelAnimationFrame(pending);
      pending = null;
      renderer.dispose();
    },
  });
  const live = installSceneControls(scene);
  const observer = new ResizeObserver(() => {
    if (!scene.disposed) {
      renderer.resize();
      invalidate();
    }
  });
  observer.observe(host);
  scene.canvas = renderer.canvas;
  scene.stats = () => ({
    ...renderer.stats(),
    objects: objects.size,
    animations: Object.keys(scene.animations).length,
  });
  scene.project = (point) => renderer.project(point);
  scene.wait = (seconds) => clip(() => {}, seconds, "Wait");

  class Object3D {
    constructor(input) {
      if (scene.disposed) throw Error("Scene is disposed");
      const descriptor = describe(input);
      this.id = `object3d-${serial++}`;
      this.scene = scene;
      this.tags = new Set();
      this.removed = false;
      this.isLive = false;
      this.descriptor = descriptor;
      this.geometry = this.targetGeometry = compileGeometry(descriptor);
      this.positions = new Float32Array(this.geometry.positions);
      this.geometryVersion = 0;
      this.style = {
        color: descriptor.color ?? descriptor.fill ?? "#70a69c",
        lineWidth: positive(descriptor.lineWidth ?? 2.5, "lineWidth"),
        wireframe: !!descriptor.wireframe,
      };
      this.target = {
        position: vector(descriptor.at ?? [0, 0, 0]),
        rotation: degrees(descriptor.rotation ?? [0, 0, 0]),
        scale: scaleVector(descriptor.scale ?? 1),
        color: parseColor(this.style.color),
      };
      this.state = {
        position: [...this.target.position],
        rotation: this.target.rotation.clone(),
        scale: [...this.target.scale],
        color: this.target.color.clone(),
        opacity: 0,
        reveal: 1,
        plan: { source: this.geometry, target: this.geometry },
        progress: 0,
      };
      this.lastPlan = null;
      this.lastProgress = -1;
      this.sampledDepth = this.geometry.depth;
      const tags =
        typeof descriptor.tags === "string"
          ? [descriptor.tags]
          : (descriptor.tags ?? []);
      if (!Array.isArray(tags))
        throw Error("tags must be a path or an array of paths");
      tags.forEach((path) => this.tags.add(tagPath(path)));
      objects.add(this);
      invalidate();
    }
    animate(sample, value, label) {
      const animation = clip(sample, value, label);
      animation.owner = this;
      return animation;
    }
    assertMutable(geometry = false) {
      if (this.removed || scene.disposed)
        throw Error("Object has been removed or its scene disposed");
      if (geometry && this.isLive)
        throw Error(
          "Live geometry comes from its factory; animate its parameters instead",
        );
    }
    resolve() {
      const { plan, progress } = this.state;
      if (this.lastPlan === plan && this.lastProgress === progress)
        return false;
      if (plan.geometryAt) {
        this.geometry = plan.geometryAt(progress);
        this.positions = this.geometry.positions;
      } else {
        if (this.geometry !== plan.source) {
          this.geometry = plan.source;
          this.positions = new Float32Array(plan.source.positions.length);
        }
        if (plan.sample) plan.sample(progress, this.positions);
        else this.positions.set(plan.target.positions);
      }
      this.sampledDepth =
        plan.source.depth === undefined
          ? undefined
          : mix(plan.source.depth, plan.target.depth, progress);
      this.lastPlan = plan;
      this.lastProgress = progress;
      this.geometryVersion++;
      return true;
    }
    addTag(path) {
      this.assertMutable();
      this.tags.add(tagPath(path));
      return this;
    }
    tag(path) {
      return this.addTag(path);
    }
    removeTag(path) {
      this.tags.delete(tagPath(path));
      return this;
    }
    show(value = 0.5) {
      this.assertMutable();
      return this.animate(
        (p) => {
          this.state.opacity = p;
          this.state.reveal = 1;
        },
        value,
        "Show",
      );
    }
    hide(value = 0.5) {
      this.assertMutable();
      return this.animate(
        (p) => {
          this.state.opacity = 1 - p;
        },
        value,
        "Hide",
      );
    }
    draw(value = 1) {
      this.assertMutable();
      return this.animate(
        (p) => {
          this.state.opacity = p === 0 ? 0 : 1;
          this.state.reveal = p;
        },
        value,
        "Draw",
      );
    }
    _prepareTransform(input, value = {}) {
      this.assertMutable(true);
      const descriptor = describe(
          input instanceof Object3D ? input.toDescriptor() : input,
        ),
        target = compileGeometry(descriptor);
      let plan;
      if (this.targetGeometry.vector || target.vector) {
        const source = this.targetGeometry,
          a = vectorAsset(source),
          b = vectorAsset(target);
        const morph =
          a === b
            ? { strategy: "extrusion", sample: () => a }
            : a.kind === "equation" && b.kind === "equation"
              ? prepareSemanticMorph(a, b)
              : prepareMorph(a, b);
        plan = {
          source,
          target,
          strategy: morph.strategy,
          correspondence: morph.correspondence,
          geometryAt(t) {
            return compileVector(
              morph.sample(t),
              mix(source.depth ?? 0, target.depth ?? 0, t),
            );
          },
        };
      } else plan = prepareGeometryMorph(this.targetGeometry, target);
      const from = {
        position: [...this.target.position],
        rotation: this.target.rotation.clone(),
        scale: [...this.target.scale],
        color: this.target.color.clone(),
      };
      const to = {
        position:
          descriptor.at === undefined ? from.position : vector(descriptor.at),
        rotation:
          descriptor.rotation === undefined
            ? from.rotation
            : degrees(descriptor.rotation),
        scale:
          descriptor.scale === undefined
            ? from.scale
            : scaleVector(descriptor.scale),
        color:
          descriptor.color === undefined && descriptor.fill === undefined
            ? from.color
            : parseColor(descriptor.color ?? descriptor.fill),
      };
      duration(optionsFor(value).duration ?? 1.5);
      return () => {
        const animation = this.animate(
          (p) => {
            const t = smooth(p);
            this.state.plan = plan;
            this.state.progress = t;
            for (let i = 0; i < 3; i++) {
              this.state.position[i] = mix(from.position[i], to.position[i], t);
              this.state.scale[i] = mix(from.scale[i], to.scale[i], t);
            }
            this.state.rotation.slerpQuaternions(from.rotation, to.rotation, t);
            this.state.color.copy(from.color).lerp(to.color, t);
          },
          { duration: 1.5, ...optionsFor(value) },
          "Transform",
        );
        animation.strategy = plan.strategy ?? "parameter-correspondence";
        if (plan.correspondence) animation.correspondence = plan.correspondence;
        this.targetGeometry = target;
        this.descriptor = descriptor;
        this.target = to;
        return animation;
      };
    }
    transformTo(input, value = {}) {
      if (
        typeof input === "string" &&
        this.descriptor.asset?.kind === "equation"
      ) {
        this.assertMutable(true);
        const before = this.descriptor;
        return scene
          .equationDescriptor(input, {
            width: before.width,
            depth: before.depth,
            color: before.color,
          })
          .then((descriptor) => this._prepareTransform(descriptor, value)());
      }
      return this._prepareTransform(input, value)();
    }
    moveTo(at, value = 1) {
      this.assertMutable();
      const from = [...this.target.position],
        to = vector(at, "position");
      const animation = this.animate(
        (p) => {
          const t = smooth(p);
          for (let i = 0; i < 3; i++)
            this.state.position[i] = mix(from[i], to[i], t);
        },
        value,
        "Move",
      );
      this.target.position = to;
      return animation;
    }
    rotateTo(rotation, value = 1) {
      this.assertMutable();
      const from = this.target.rotation.clone(),
        to = degrees(rotation);
      const animation = this.animate(
        (p) => this.state.rotation.slerpQuaternions(from, to, smooth(p)),
        value,
        "Rotate",
      );
      this.target.rotation = to;
      return animation;
    }
    rotateBy(rotation, value = 1) {
      this.assertMutable();
      const from = this.target.rotation.clone(),
        delta = vector(rotation, "rotation").map((n) => (n * Math.PI) / 180),
        euler = new Euler(),
        turn = new Quaternion();
      const animation = this.animate(
        (p) => {
          const t = smooth(p);
          euler.set(...delta.map((n) => n * t));
          this.state.rotation.copy(from).multiply(turn.setFromEuler(euler));
        },
        value,
        "Rotate",
      );
      this.target.rotation = from.clone().multiply(degrees(rotation));
      return animation;
    }
    scaleTo(scale, value = 1) {
      this.assertMutable();
      const from = [...this.target.scale],
        to = scaleVector(scale);
      const animation = this.animate(
        (p) => {
          const t = smooth(p);
          for (let i = 0; i < 3; i++)
            this.state.scale[i] = mix(from[i], to[i], t);
        },
        value,
        "Scale",
      );
      this.target.scale = to;
      return animation;
    }
    colorTo(color, value = 1) {
      this.assertMutable();
      const from = this.target.color.clone(),
        to = parseColor(color);
      const animation = this.animate(
        (p) => this.state.color.copy(from).lerp(to, smooth(p)),
        value,
        "Color",
      );
      this.target.color = to;
      return animation;
    }
    extrude(depth, value = {}) {
      this.assertMutable(true);
      finite(depth, "depth");
      if (this.descriptor.type === "vector")
        return this.transformTo({ ...this.descriptor, depth }, value);
      const shape =
        this.descriptor.type === "extrusion"
          ? this.descriptor.shape
          : this.descriptor;
      return this.transformTo(
        {
          type: "extrusion",
          shape,
          depth,
          ...(this.descriptor.color ? { color: this.descriptor.color } : {}),
        },
        value,
      );
    }
    toDescriptor() {
      this.assertMutable();
      const pose = this.target,
        geometry = this.targetGeometry;
      const position = new Vector3(),
        rotation = pose.rotation.clone(),
        scale = [...pose.scale],
        at = [...pose.position],
        size = new Vector3(...scale),
        offset = new Vector3(...at);
      const place = (p) =>
        position
          .fromArray(p)
          .multiply(size)
          .applyQuaternion(rotation)
          .add(offset)
          .toArray();
      const baked = {
        at: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: 1,
        color: "#" + pose.color.getHexString(),
      };
      if (geometry.kind === "curve")
        return {
          type: "curve",
          segments: geometry.positions.length / 3 - 1,
          fn: (t) => place(geometry.sample(t)),
          ...baked,
        };
      if (geometry.grid)
        return {
          type: "surface",
          uSegments: geometry.grid[0],
          vSegments: geometry.grid[1],
          fn: (u, v) => place(geometry.sample(u, v)),
          ...baked,
        };
      return {
        ...this.descriptor,
        at,
        rotation: new Euler()
          .setFromQuaternion(rotation)
          .toArray()
          .slice(0, 3)
          .map((n) => (n * 180) / Math.PI),
        scale,
      };
    }
    snapshot() {
      this.resolve();
      return {
        id: this.id,
        kind: this.geometry.kind,
        positions: new Float32Array(this.positions),
        position: [...this.state.position],
        rotation: this.state.rotation.toArray(),
        scale: [...this.state.scale],
        opacity: this.state.opacity,
        reveal: this.state.reveal,
        tags: [...this.tags],
        depth: this.sampledDepth,
      };
    }
    duplicate(options = {}) {
      this.assertMutable();
      return scene.shape({
        ...this.descriptor,
        at: [...this.target.position],
        rotation: new Euler()
          .setFromQuaternion(this.target.rotation)
          .toArray()
          .slice(0, 3)
          .map((n) => (n * 180) / Math.PI),
        scale: [...this.target.scale],
        color: "#" + this.target.color.getHexString(),
        tags: [...this.tags],
        ...options,
      });
    }
    remove() {
      if (this.removed) return;
      this.unbind?.();
      renderer.removeObject(this);
      objects.delete(this);
      this.tags.clear();
      this.removed = true;
      for (const [name, animation] of Object.entries(scene.animations))
        if (animation.owner === this) {
          if (animation.group)
            animation.group.list = animation.group.list.filter(
              (a) => a !== animation,
            );
          delete scene.animations[name];
        }
      scene.invalidate();
      invalidate();
    }
  }

  function batch(make, value = {}) {
    const opts = optionsFor(value);
    duration(opts.duration ?? 1);
    if (!["together", "sequential"].includes(opts.order ?? "together"))
      throw Error("Group order must be together or sequential");
    const stagger = duration(opts.stagger ?? 0);
    const animations = make();
    const group = {
      list: animations,
      startGroupAnimationsImmediately: false,
      startNextImmediately() {
        this.startGroupAnimationsImmediately = true;
        scene.invalidate();
        return this;
      },
    };
    animations.forEach((a, i) => {
      a.group = group;
      a.animateNextImmediately = (opts.order ?? "together") !== "sequential";
      a.offset = a.animateNextImmediately ? stagger * i : 0;
    });
    scene.invalidate();
    return group;
  }
  class Selection {
    constructor(resolve, label) {
      this.resolve = resolve;
      this.label = label;
    }
    get objects() {
      return this.resolve().filter((o) => !o.removed);
    }
    get count() {
      return this.objects.length;
    }
    require() {
      const list = this.objects;
      if (!list.length) throw Error(`No objects selected by ${this.label}`);
      return list;
    }
    draw(options = {}) {
      const list = this.require();
      return batch(() => list.map((o) => o.draw(options)), options);
    }
    show(options = {}) {
      const list = this.require();
      return batch(() => list.map((o) => o.show(options)), options);
    }
    hide(options = {}) {
      const list = this.require();
      return batch(() => list.map((o) => o.hide(options)), options);
    }
    moveTo(at, options = {}) {
      const list = this.require(),
        to = vector(at),
        center = [0, 1, 2].map(
          (i) =>
            list.reduce((sum, o) => sum + o.target.position[i], 0) /
            list.length,
        );
      return batch(
        () =>
          list.map((o) =>
            o.moveTo(
              o.target.position.map((n, i) => n + to[i] - center[i]),
              options,
            ),
          ),
        options,
      );
    }
    transformTo(input, options = {}) {
      const list = this.require();
      let targets;
      if (Array.isArray(input)) {
        if (input.length !== list.length)
          throw Error("Provide one target per selected object");
        targets = input;
      } else if (list.length === 1) targets = [input];
      else {
        const descriptor = describe(input),
          geometry = compileGeometry(descriptor);
        const pose = {
          at: descriptor.at ?? [0, 0, 0],
          rotation: descriptor.rotation ?? [0, 0, 0],
          scale: descriptor.scale ?? 1,
          ...(descriptor.color !== undefined || descriptor.fill !== undefined
            ? { color: descriptor.color ?? descriptor.fill }
            : {}),
        };
        if (
          geometry.kind === "curve" &&
          list.every((o) => o.targetGeometry.kind === "curve")
        ) {
          targets = list.map((o, i) => ({
            type: "curve",
            segments: o.targetGeometry.positions.length / 3 - 1,
            fn: (t) => geometry.sample((i + t) / list.length),
            ...pose,
          }));
        } else if (geometry.grid && list.every((o) => o.targetGeometry.grid)) {
          targets = list.map((o, i) => ({
            type: "surface",
            uSegments: o.targetGeometry.grid[0],
            vSegments: o.targetGeometry.grid[1],
            fn: (u, v) => geometry.sample((i + u) / list.length, v),
            ...pose,
          }));
        } else if (
          descriptor.type === "cube" &&
          list.length === 6 &&
          list.every((o) => o.targetGeometry.grid)
        ) {
          const x = positive(descriptor.width ?? descriptor.size ?? 2) / 2;
          const y = positive(descriptor.height ?? descriptor.size ?? 2) / 2;
          const z = (descriptor.depth ?? descriptor.size ?? 2) / 2;
          const faces = [
            (u, v) => [x, u * y, v * z],
            (u, v) => [-x, u * y, -v * z],
            (u, v) => [u * x, y, v * z],
            (u, v) => [u * x, -y, -v * z],
            (u, v) => [u * x, v * y, z],
            (u, v) => [-u * x, v * y, -z],
          ];
          targets = list.map((o, i) => ({
            type: "surface",
            uSegments: o.targetGeometry.grid[0],
            vSegments: o.targetGeometry.grid[1],
            fn: (u, v) => faces[i](u * 2 - 1, v * 2 - 1),
            ...pose,
          }));
        } else
          throw Error(
            "Assembly needs curves into a curve, sampled surfaces into a surface, or six sampled surfaces into a cube. Pass a target array for individual transforms.",
          );
      }
      // Validate the entire operation before adding any tracks or changing authored targets.
      const commits = list.map((o, i) =>
        o._prepareTransform(targets[i], options),
      );
      return batch(() => commits.map((commit) => commit()), options);
    }
    addTag(path) {
      for (const o of this.require()) o.addTag(path);
      return this;
    }
    remove() {
      for (const o of this.objects) o.remove();
    }
  }
  scene.tag = (path) =>
    new Selection(() => selectTag(objects, path), tagPath(path));
  scene.tags = { tree: () => createTagTree(objects) };
  scene.group = (path, members) => {
    tagPath(path);
    if (
      !Array.isArray(members) ||
      members.some((o) => !o || o.scene !== scene || o.removed)
    )
      throw Error("Group members must belong to this scene");
    for (const o of members) o.addTag(path);
    return scene.tag(path);
  };
  scene.all = () => new Selection(() => [...objects], "all objects");
  scene.shape = (descriptor) => new Object3D(descriptor);
  for (const name of geometryNames)
    scene[name] = (options = {}) => scene.shape({ type: name, ...options });
  scene.curve = (fn, options = {}) =>
    scene.shape(
      typeof fn === "function"
        ? { type: "curve", fn, ...options }
        : describe(fn, options),
    );
  scene.surface = (fn, options = {}) =>
    scene.shape(
      typeof fn === "function"
        ? { type: "surface", fn, ...options }
        : describe(fn, options),
    );
  const asInput = (value) =>
    value instanceof Object3D ? value.toDescriptor() : value;
  scene.fillBetween = (from, to, options = {}) =>
    scene.shape({
      type: "between",
      from: asInput(from),
      to: asInput(to),
      ...options,
    });
  scene.loft = (curves, options = {}) =>
    scene.shape({ type: "loft", curves: curves.map(asInput), ...options });
  scene.revolve = (profile, options = {}) =>
    scene.shape({ type: "revolve", profile: asInput(profile), ...options });
  scene.tube = (curve, options = {}) =>
    scene.shape({ type: "tube", curve: asInput(curve), ...options });
  scene.ribbon = (curve, options = {}) =>
    scene.shape({ type: "ribbon", curve: asInput(curve), ...options });
  scene.fill = (boundary, options = {}) =>
    scene.shape({
      type: "fill",
      boundary: asInput(boundary),
      ...options,
      holes: (options.holes ?? []).map(asInput),
    });
  scene.equationDescriptor = async (expression, options = {}) => {
    if (!assets?.equation) throw Error("The equation loader is unavailable");
    const { width = 4.8, depth = 0.08, color = "#284842", ...pose } = options;
    const asset = await assets.equation(expression, {
      scene,
      width,
      color,
      at: [0, 0],
    });
    return { type: "vector", asset, width, depth, color, ...pose };
  };
  scene.equation = async (expression, options = {}) =>
    scene.shape(await scene.equationDescriptor(expression, options));
  scene.svg = (markup, options = {}) => {
    const { width = 4, depth = 0, color = "#70a69c", ...pose } = options;
    const asset = fitAsset(parseSVG(markup), {
      width,
      centered: true,
      fill: color,
    });
    return scene.shape({ type: "vector", asset, width, depth, color, ...pose });
  };
  scene.liveShape = (generate) => {
    if (typeof generate !== "function")
      throw Error("liveShape expects a descriptor factory");
    const object = scene.shape(generate());
    object.isLive = true;
    object.unbind = live.bind(() => {
      const next = compileGeometry(generate());
      prepareGeometryMorph(object.geometry, next);
      object.targetGeometry = next;
      object.descriptor = next.descriptor;
      object.state.plan = { source: next, target: next };
      object.state.progress = 0;
      invalidate();
    });
    return object;
  };
  let cameraTarget = [...renderer.cameraState.at];
  scene.camera = {
    moveTo(at, value = 1) {
      const from = [...cameraTarget],
        to = vector(at, "camera position");
      if (
        Math.hypot(...to.map((n, i) => n - renderer.cameraState.lookAt[i])) <
        1e-6
      )
        throw Error("Camera position and lookAt must differ");
      const animation = clip(
        (p) => {
          const t = smooth(p);
          renderer.cameraState.at = from.map((n, i) => mix(n, to[i], t));
        },
        value,
        "Camera move",
      );
      cameraTarget = to;
      return animation;
    },
    lookAt(at) {
      const target = vector(at, "camera target");
      if (Math.hypot(...target.map((n, i) => n - cameraTarget[i])) < 1e-6)
        throw Error("Camera position and lookAt must differ");
      renderer.cameraState.lookAt = target;
      invalidate();
      return this;
    },
  };
  scene.slider = (container, { label = "Progress" } = {}) => {
    const parent =
      typeof container === "string"
        ? document.querySelector(container)
        : container;
    if (!parent) throw Error("Slider container not found");
    scene.prepare();
    const element = document.createElement("label");
    element.className = "rhyform-control";
    const text = document.createElement("span");
    text.textContent = label;
    const input = document.createElement("input");
    input.type = "range";
    input.min = 0;
    input.step = 0.01;
    input.setAttribute("aria-label", label);
    const output = document.createElement("output");
    element.append(text, input, output);
    parent.append(element);
    const onInput = () => scene.seek(Number(input.value));
    input.addEventListener("input", onInput);
    const update = () => {
      input.max = scene.duration;
      input.value = scene.currentTime;
      output.textContent = `${scene.currentTime.toFixed(1)} / ${scene.duration.toFixed(1)} s`;
      input.setAttribute("aria-valuetext", output.textContent);
    };
    const off = scene.onUpdate(update);
    update();
    const control = {
      input,
      element,
      remove() {
        off();
        input.removeEventListener("input", onInput);
        element.remove();
        sliders.delete(control);
      },
    };
    sliders.add(control);
    return control;
  };
  flush();
  return scene;
}
