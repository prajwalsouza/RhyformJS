export const clamp = (value) => Math.max(0, Math.min(1, value));
export const mix = (a, b, t) => a + (b - a) * t;
export function finite(value, label = "value") {
  if (!Number.isFinite(value)) throw new TypeError(`${label} must be finite`);
  return value;
}
export function duration(value) {
  finite(value, "duration");
  if (value < 0) throw new RangeError("duration must be non-negative");
  return value;
}
