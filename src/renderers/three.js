import {
  WebGLRenderer,
  Scene,
  OrthographicCamera,
  PerspectiveCamera,
  HemisphereLight,
  DirectionalLight,
  BufferGeometry,
  BufferAttribute,
  Mesh,
  MeshStandardMaterial,
  DoubleSide,
  DynamicDrawUsage,
  Color,
  Vector3,
} from "three";
import { Line2 } from "three/addons/lines/Line2.js";
import { LineGeometry } from "three/addons/lines/LineGeometry.js";
import { LineMaterial } from "three/addons/lines/LineMaterial.js";
import { positive, vector } from "../geometry3d.js";

export function createThreeRenderer(host, options = {}) {
  const viewHeight = positive(options.viewHeight ?? 6.5, "viewHeight");
  const projection = options.projection ?? "orthographic";
  if (!["orthographic", "perspective"].includes(projection))
    throw Error("Camera projection must be orthographic or perspective");
  const pixelRatio = Math.min(
    window.devicePixelRatio || 1,
    positive(options.pixelRatio ?? 2, "pixelRatio"),
  );
  const cameraState = {
    at: vector(options.camera?.at ?? [6, 4, 8]),
    lookAt: vector(options.camera?.lookAt ?? [0, 0, 0]),
  };
  if (
    Math.hypot(...cameraState.at.map((n, i) => n - cameraState.lookAt[i])) <
    1e-6
  )
    throw Error("Camera position and lookAt must differ");
  const background = parseColor(options.background ?? "#fbfaf7");
  const renderer = new WebGLRenderer({ antialias: true, alpha: false });
  const world = new Scene(),
    resources = new Map();
  renderer.setClearColor(background);
  renderer.setPixelRatio(pixelRatio);
  const camera =
    projection === "perspective"
      ? new PerspectiveCamera(40, 1, 0.01, 1000)
      : new OrthographicCamera(-4, 4, 3, -3, 0.01, 1000);
  world.add(new HemisphereLight("#fff8e8", "#657979", 2.1));
  const light = new DirectionalLight("#fff4df", 2.6);
  light.position.set(4, 7, 5);
  world.add(light);
  const canvas = renderer.domElement;
  canvas.style.cssText = "display:block;width:100%;height:100%;";
  canvas.setAttribute("role", "img");
  canvas.setAttribute(
    "aria-label",
    options.description ?? "Three-dimensional mathematical animation",
  );
  host.append(canvas);
  let width = 0,
    height = 0,
    draws = 0,
    lost = false,
    disposed = false;
  function resize() {
    const nextWidth = Math.max(1, host.clientWidth), nextHeight = Math.max(1, host.clientHeight);
    if (nextWidth === width && nextHeight === height) return false;
    width = nextWidth;
    height = nextHeight;
    renderer.setSize(width, height, false);
    if (camera.isPerspectiveCamera) camera.aspect = width / height;
    else {
      camera.top = viewHeight / 2;
      camera.bottom = -viewHeight / 2;
      camera.right = ((viewHeight / 2) * width) / height;
      camera.left = -camera.right;
    }
    camera.updateProjectionMatrix();
    return true;
  }
  function addObject(object) {
    const asset = object.geometry;
    let geometry, material, node;
    if (asset.kind === "curve") {
      geometry = new LineGeometry().setPositions(asset.positions);
      geometry.attributes.instanceStart.data.setUsage(DynamicDrawUsage);
      material = new LineMaterial({
        color: object.target.color,
        linewidth: object.style.lineWidth,
        alphaToCoverage: true,
      });
      node = new Line2(geometry, material);
    } else {
      geometry = new BufferGeometry();
      geometry.setAttribute(
        "position",
        new BufferAttribute(new Float32Array(asset.positions), 3).setUsage(
          DynamicDrawUsage,
        ),
      );
      geometry.setIndex(new BufferAttribute(new Uint32Array(asset.indices), 1));
      geometry.computeVertexNormals();
      material = new MeshStandardMaterial({
        color: object.target.color,
        roughness: 0.75,
        metalness: 0,
        side: DoubleSide,
        flatShading: asset.flatShading ?? false,
        wireframe: object.style.wireframe,
      });
      node = new Mesh(geometry, material);
    }
    node.name = object.id;
    world.add(node);
    resources.set(object, {
      node,
      geometry,
      material,
      version: -1,
      reveal: -1,
    });
  }
  function removeObject(object) {
    const item = resources.get(object);
    if (!item) return;
    world.remove(item.node);
    item.geometry.dispose();
    item.material.dispose();
    resources.delete(object);
  }
  function sync(object) {
    if (!resources.has(object)) addObject(object);
    const r = resources.get(object),
      state = object.state,
      asset = object.geometry;
    const changed = r.version !== object.geometryVersion;
    if (asset.kind === "curve") {
      if (changed || r.reveal !== state.reveal) {
        const p = object.positions,
          a = r.geometry.attributes.instanceStart.data.array,
          n = p.length / 3 - 1;
        for (let i = 0; i < n; i++)
          for (let k = 0; k < 3; k++) {
            a[i * 6 + k] = p[i * 3 + k];
            a[i * 6 + 3 + k] = p[(i + 1) * 3 + k];
          }
        const end = Math.max(0, Math.min(n, state.reveal * n)),
          whole = Math.floor(end),
          fraction = end - whole;
        if (fraction && whole < n)
          for (let k = 0; k < 3; k++)
            a[whole * 6 + 3 + k] =
              p[whole * 3 + k] +
              (p[(whole + 1) * 3 + k] - p[whole * 3 + k]) * fraction;
        r.geometry.instanceCount = Math.ceil(end);
        r.geometry.attributes.instanceStart.data.needsUpdate = true;
        r.geometry.computeBoundingBox();
        r.geometry.computeBoundingSphere();
      }
      r.material.resolution.set(width, height);
    } else {
      if (changed) {
        if (
          r.geometry.attributes.position.array.length !==
            object.positions.length ||
          r.geometry.index.array.length !== asset.indices.length
        ) {
          // Dispose the old GPU buffer before replacing a dynamically tessellated glyph mesh.
          r.geometry.dispose();
          r.geometry = new BufferGeometry();
          r.node.geometry = r.geometry;
          r.geometry.setAttribute(
            "position",
            new BufferAttribute(
              new Float32Array(object.positions.length),
              3,
            ).setUsage(DynamicDrawUsage),
          );
          r.geometry.setIndex(
            new BufferAttribute(new Uint32Array(asset.indices), 1),
          );
        } else {
          r.geometry.index.array.set(asset.indices);
          r.geometry.index.needsUpdate = true;
        }
        r.geometry.attributes.position.array.set(object.positions);
        r.geometry.attributes.position.needsUpdate = true;
        r.geometry.computeVertexNormals();
        r.geometry.computeBoundingBox();
        r.geometry.computeBoundingSphere();
      }
      const count =
        object.sampledDepth === 0 && asset.flatCount
          ? asset.flatCount
          : asset.indices.length;
      r.geometry.setDrawRange(0, Math.floor((count * state.reveal) / 3) * 3);
    }
    r.version = object.geometryVersion;
    r.reveal = state.reveal;
    r.node.position.fromArray(state.position);
    r.node.quaternion.copy(state.rotation);
    r.node.scale.fromArray(state.scale);
    r.node.visible = state.opacity > 0 && state.reveal > 0;
    r.material.color.copy(state.color);
    r.material.opacity = state.opacity;
    const transparent = state.opacity < 1;
    if (r.material.transparent !== transparent) {
      r.material.transparent = transparent;
      r.material.needsUpdate = true;
    }
    r.material.depthWrite = !transparent;
  }
  function render(objects) {
    if (disposed || lost) return;
    for (const object of objects) sync(object);
    camera.position.fromArray(cameraState.at);
    camera.lookAt(new Vector3().fromArray(cameraState.lookAt));
    camera.updateMatrixWorld();
    renderer.render(world, camera);
    draws++;
  }
  const onLost = (event) => {
    event.preventDefault();
    lost = true;
    options.onContextLost?.();
  };
  const onRestored = () => {
    lost = false;
    for (const r of resources.values()) r.version = -1;
    options.onContextRestored?.();
  };
  canvas.addEventListener("webglcontextlost", onLost);
  canvas.addEventListener("webglcontextrestored", onRestored);
  resize();
  return {
    canvas,
    cameraState,
    render,
    resize,
    removeObject,
    stats: () => ({
      draws,
      objects: resources.size,
      geometries: renderer.info.memory.geometries,
      drawCalls: renderer.info.render.calls,
      lost,
      interactionTargets: 0,
      pickTests: 0,
    }),
    project(point) {
      camera.position.fromArray(cameraState.at);
      camera.lookAt(new Vector3().fromArray(cameraState.lookAt));
      camera.updateMatrixWorld();
      const p = new Vector3(...vector(point)).project(camera);
      return {
        x: ((p.x + 1) * width) / 2,
        y: ((1 - p.y) * height) / 2,
        depth: p.z,
        visible:
          p.z >= -1 && p.z <= 1 && Math.abs(p.x) <= 1 && Math.abs(p.y) <= 1,
      };
    },
    dispose() {
      if (disposed) return;
      for (const o of [...resources.keys()]) removeObject(o);
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
      disposed = true;
    },
  };
}

export function parseColor(value) {
  if (typeof value !== "string") throw Error("Use an opaque CSS color string");
  const style = value.trim().toLowerCase();
  const hex = /^#(?:[a-f0-9]{3}|[a-f0-9]{6})$/;
  const rgb =
    /^rgb\(\s*(?:\d+\s*,\s*\d+\s*,\s*\d+|\d+%\s*,\s*\d+%\s*,\s*\d+%)\s*\)$/;
  const hsl = /^hsl\(\s*\d*\.?\d+\s*,\s*\d*\.?\d+%\s*,\s*\d*\.?\d+%\s*\)$/;
  if (
    !CSS.supports("color", style) ||
    !(
      hex.test(style) ||
      rgb.test(style) ||
      hsl.test(style) ||
      Object.hasOwn(Color.NAMES, style)
    )
  ) {
    throw Error(
      "Use opaque hex, comma-separated rgb/hsl, or a named color; show/hide controls opacity",
    );
  }
  return new Color(style);
}
