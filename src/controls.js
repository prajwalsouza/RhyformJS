import { finite } from './svg.js';

export function installSceneControls(scene) {
  const parameters = new Set(), bindings = new Set(), controls = new Set();
  let refreshing = false;
  const refresh = () => {
    if (refreshing) throw new Error('Live shape functions must only read parameters');
    refreshing = true;
    try { for (const update of bindings) update(); } finally { refreshing = false; }
  };
  scene.onUpdate(refresh);
  scene.parameter = (name, { value = 1, min = 0, max = 2, step = .1 } = {}) => {
    if (scene.disposed) throw new Error('Scene is disposed');
    [value, min, max, step].forEach(n => finite(n));
    if (min >= max || step <= 0) throw new Error('Parameter requires min < max and step > 0');
    const normalize = v => Math.max(min, Math.min(max, Number((min + Math.round((finite(v) - min) / step) * step).toPrecision(12))));
    let current = normalize(value);
    const listeners = new Set();
    const parameter = {
      name: String(name), min, max, step,
      get value() { return current; },
      set value(next) {
        if (!parameters.has(parameter) || scene.disposed) throw new Error('Parameter belongs to a cleared or disposed scene');
        if (refreshing) throw new Error('Live shape functions must only read parameters');
        const v = normalize(next); if (v === current) return;
        const previous = current; current = v;
        try { refresh(); } catch (error) { current = previous; refresh(); throw error; }
        for (const listener of listeners) listener(current);
      },
      subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); }
    };
    parameters.add(parameter); return parameter;
  };
  // Used by live geometry. Clock and parameter updates share one evaluation path.
  const bind = update => { bindings.add(update); return () => bindings.delete(update); };
  scene.controls = (container, { parameters: shown = [...parameters], playback = true } = {}) => {
    if (scene.disposed) throw new Error('Scene is disposed');
    const host = typeof container === 'string' ? document.querySelector(container) : container;
    if (!host) throw new Error('Controls container not found');
    if (shown.some(p => !parameters.has(p))) throw new Error('Controls require parameters belonging to this scene');
    const element = document.createElement('div');element.className = 'rhyform-controls';
    const cleanup = [], inputs = new Map();
    for (const parameter of shown) {
      const row = document.createElement('label');row.className = 'rhyform-parameter';
      const label = document.createElement('span');label.textContent = parameter.name;
      const input = document.createElement('input');input.type = 'range';input.min = parameter.min;input.max = parameter.max;input.step = parameter.step;input.setAttribute('aria-label', parameter.name);
      const output = document.createElement('output');
      const update = () => { input.value = parameter.value;output.textContent = String(parameter.value);input.setAttribute('aria-valuetext', String(parameter.value)); };
      const change = () => { parameter.value = Number(input.value); };
      input.addEventListener('input', change);cleanup.push(() => input.removeEventListener('input', change), parameter.subscribe(update));update();
      row.append(label, input, output);element.append(row);inputs.set(parameter, input);
    }
    let slider;
    if (playback) {
      const transport = document.createElement('div');transport.className = 'rhyform-playback';
      const play = document.createElement('button'), restart = document.createElement('button');play.type = restart.type = 'button';restart.textContent = 'Restart';
      const toggle = () => scene.playing ? scene.pause() : scene.currentTime >= scene.duration ? scene.play() : scene.resume();
      const reset = () => scene.play();
      play.addEventListener('click', toggle);restart.addEventListener('click', reset);
      cleanup.push(() => play.removeEventListener('click', toggle), () => restart.removeEventListener('click', reset));
      const update = () => { play.textContent = scene.playing ? 'Pause' : 'Play';play.setAttribute('aria-label', scene.playing ? 'Pause scene' : 'Play scene'); };
      cleanup.push(scene.onUpdate(update));update();transport.append(play, restart);element.append(transport);
      slider = scene.slider(element);
    }
    host.append(element);
    const control = { element, inputs, remove() { for (const fn of cleanup.splice(0)) fn();slider?.remove();element.remove();controls.delete(control); } };
    controls.add(control);return control;
  };
  const clear = scene.clear;
  scene.clear = () => { bindings.clear();for (const control of [...controls]) control.remove();parameters.clear();return clear(); };
  return { bind };
}
