// Temporary camera inspection. It never writes the authored camera or timeline.
// Events render on demand; there is no inertia, picking, zoom, or idle loop.
export function createViewRotation(canvas, cameraState, invalidate) {
  let enabled = false,
    pointer = null,
    lastX = 0,
    lastY = 0,
    yaw = 0,
    pitch = 0;
  const original = {
    cursor: canvas.style.cursor,
    touchAction: canvas.style.touchAction,
    tabIndex: canvas.getAttribute("tabindex"),
    description: canvas.getAttribute("aria-description"),
    shortcuts: canvas.getAttribute("aria-keyshortcuts"),
  };
  const restore = (attribute, value) =>
    value === null
      ? canvas.removeAttribute(attribute)
      : canvas.setAttribute(attribute, value);
  function spherical() {
    const delta = cameraState.at.map((n, i) => n - cameraState.lookAt[i]);
    const radius = Math.hypot(...delta);
    return {
      radius,
      theta: Math.atan2(delta[0], delta[2]),
      phi: Math.acos(Math.max(-1, Math.min(1, delta[1] / radius))),
    };
  }
  function rotate(dx, dy) {
    const { phi } = spherical();
    yaw = (yaw + dx) % (2 * Math.PI);
    pitch = Math.max(.02, Math.min(Math.PI - .02, phi + pitch + dy)) - phi;
    invalidate();
  }
  function finish(event) {
    if (pointer === null || (event && event.pointerId !== pointer)) return;
    const id = pointer;
    pointer = null;
    canvas.removeEventListener("pointermove", move);
    canvas.removeEventListener("pointerup", finish);
    canvas.removeEventListener("pointercancel", finish);
    canvas.removeEventListener("lostpointercapture", finish);
    if (canvas.hasPointerCapture(id)) canvas.releasePointerCapture(id);
    canvas.style.cursor = enabled ? "grab" : original.cursor;
  }
  function move(event) {
    if (event.pointerId !== pointer) return;
    const scale = (2 * Math.PI) / Math.max(1, canvas.clientHeight);
    rotate(-(event.clientX - lastX) * scale, -(event.clientY - lastY) * scale);
    lastX = event.clientX;
    lastY = event.clientY;
  }
  function down(event) {
    if (!enabled || pointer !== null || !event.isPrimary || event.button !== 0) return;
    canvas.setPointerCapture(event.pointerId);
    pointer = event.pointerId;
    lastX = event.clientX;
    lastY = event.clientY;
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", finish);
    canvas.addEventListener("pointercancel", finish);
    canvas.addEventListener("lostpointercapture", finish);
    canvas.style.cursor = "grabbing";
    canvas.focus({ preventScroll: true });
    event.preventDefault();
  }
  function key(event) {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const step = Math.PI / 36;
    const directions = {
      ArrowLeft: [step, 0], ArrowRight: [-step, 0],
      ArrowUp: [0, -step], ArrowDown: [0, step],
    };
    if (directions[event.key]) rotate(...directions[event.key]);
    else if (event.key === "Home" || event.key === "Escape") reset();
    else return;
    event.preventDefault();
  }
  function reset() {
    finish();
    if (yaw !== 0 || pitch !== 0) {
      yaw = pitch = 0;
      invalidate();
    }
  }
  function setEnabled(next) {
    if (next === enabled) return;
    enabled = next;
    if (enabled) {
      canvas.addEventListener("pointerdown", down);
      canvas.addEventListener("keydown", key);
      canvas.style.cursor = "grab";
      // One finger rotates; browser pinch accessibility remains available.
      canvas.style.touchAction = "pinch-zoom";
      canvas.setAttribute("tabindex", "0");
      canvas.setAttribute("aria-description", "Drag or use arrow keys to rotate the paused view. Home resets it. Playing restores the authored view. Zoom and pan are disabled.");
      canvas.setAttribute("aria-keyshortcuts", "ArrowLeft ArrowRight ArrowUp ArrowDown Home Escape");
    } else {
      finish();
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("keydown", key);
      canvas.style.cursor = original.cursor;
      canvas.style.touchAction = original.touchAction;
      restore("tabindex", original.tabIndex);
      restore("aria-description", original.description);
      restore("aria-keyshortcuts", original.shortcuts);
    }
  }
  return {
    setEnabled,
    reset,
    position() {
      if (yaw === 0 && pitch === 0) return cameraState.at;
      const { radius, theta, phi } = spherical();
      const angle = Math.max(.02, Math.min(Math.PI - .02, phi + pitch));
      const ring = radius * Math.sin(angle);
      return [ring * Math.sin(theta + yaw), radius * Math.cos(angle), ring * Math.cos(theta + yaw)]
        .map((n, i) => n + cameraState.lookAt[i]);
    },
    dispose() { setEnabled(false); },
  };
}
