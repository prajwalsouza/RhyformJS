import api from "./index.js";
import { createScene3D } from "./scene3d.js";
import {
  compileGeometry,
  prepareGeometryMorph,
  describe,
  geometryNames,
} from "./geometry3d.js";

const scene2D = api.scene;
api.scene = (selector, options = {}) => {
  const dimensions = options.dimensions ?? 2;
  if (dimensions === 3) return createScene3D(selector, options, api);
  if (dimensions !== 2) throw Error("Scene dimensions must be 2 or 3");
  return scene2D(selector, options);
};
api.geometry3D = {
  describe,
  compile: compileGeometry,
  prepareMorph: prepareGeometryMorph,
};
api.shapes3D = Object.fromEntries(
  geometryNames.map((type) => [
    type,
    (options = {}) => describe({ type, ...options }),
  ]),
);
export default api;
