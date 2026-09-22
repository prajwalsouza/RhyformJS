import { installTimeline } from "./timeline.js";
import { colorMix } from "./svg.js";

function interpolate(a, b, t) {
  if (a === b) return a;
  const left = /^(-?[\d.]+)([a-z%]*)$/i.exec(String(a));
  const right = /^(-?[\d.]+)([a-z%]*)$/i.exec(String(b));
  if (left && right && left[2] === right[2])
    return `${Number(left[1]) + (Number(right[1]) - Number(left[1])) * t}${left[2]}`;
  if (CSS.supports("color", String(a)) && CSS.supports("color", String(b)))
    return colorMix(a, b, t);
  return t < 1 ? a : b;
}

export function installLegacyTimeline(scene, viewX, api) {
  installTimeline(scene, {
    apply(a, progress) {
      const o = a.animationOptions;
      if (a.type === "viewX") {
        const keys = Object.keys(o.keyframes)
          .map(Number)
          .sort((a, b) => a - b);
        if (keys.length)
          viewX.setAnimationFrame(
            a.name,
            keys[0] + (keys.at(-1) - keys[0]) * progress,
          );
      } else if (a.type === "html-css-style") {
        o.element.style.transition = "none";
        for (const key of Object.keys(o.propertiesAtStart))
          o.element.style[key] = interpolate(
            o.propertiesAtStart[key],
            o.propertiesAtEnd[key],
            progress,
          );
        if ("opacity" in o.propertiesAtEnd)
          o.element.style.pointerEvents =
            Number(o.element.style.opacity) === 0 ? "none" : "auto";
      }
    },
    clear() {
      api.removeElementsWithTag("<scene>" + scene.name);
      for (const a of Object.values(scene.animations))
        if (a.type === "viewX") {
          viewX.stopAnimation(a.name);
          delete viewX.animationData[a.name];
          delete viewX.animationIntervals[a.name];
        }
    },
    dispose() {
      delete api.scenes[scene.name];
    },
  });
}
