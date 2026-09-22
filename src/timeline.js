import { clamp, duration, colorMix } from './svg.js';

function interpolate(a, b, t) {
  if (a === b) return a;
  const left = /^(-?[\d.]+)([a-z%]*)$/i.exec(String(a));
  const right = /^(-?[\d.]+)([a-z%]*)$/i.exec(String(b));
  if (left && right && left[2] === right[2]) return `${Number(left[1]) + (Number(right[1]) - Number(left[1])) * t}${left[2]}`;
  if (CSS.supports('color', String(a)) && CSS.supports('color', String(b))) return colorMix(a, b, t);
  return t < 1 ? a : b;
}

export function installTimeline(scene, viewX, api) {
  let frame = null, origin = 0, tracks = [], compiledCount = -1, effectsFrom = -1e-9;
  const listeners = new Set();
  scene.currentTime = 0;
  scene.duration = 0;
  scene.playing = false;
  scene.epoch = 0;
  scene.disposed = false;
  scene.onUpdate = listener => { listeners.add(listener); return () => listeners.delete(listener); };
  scene.invalidate = () => { compiledCount = -1; };
  const emit = () => { for (const listener of listeners) listener(scene); };
  function compile() {
    const animations = Object.values(scene.animations);
    if (compiledCount === animations.length) return;
    tracks = [];
    const visited = new Set();
    let cursor = 0;
    for (const animation of animations) {
      if (visited.has(animation)) continue;
      const group = animation.group?.list || [animation];
      const start = cursor;
      let inside = start, end = start;
      for (const a of group) {
        if (visited.has(a)) continue;
        duration(a.duration);
        tracks.push({ animation: a, start: inside, end: inside + a.duration });
        end = Math.max(end, inside + a.duration);
        if (!a.animateNextImmediately) inside += a.duration;
        visited.add(a);
      }
      cursor = (animation.group ? animation.group.startGroupAnimationsImmediately : animation.animateNextImmediately) ? start : end;
    }
    scene.duration = tracks.reduce((max, t) => Math.max(max, t.end), 0);
    scene.animationIndices = Object.keys(scene.animations);
    compiledCount = animations.length;
  }
  function apply(track, progress) {
    const a = track.animation, o = a.animationOptions;
    if (a.type === 'custom') { o.sample(progress); return; }
    if (a.type === 'viewX') {
      const keys = Object.keys(o.keyframes).map(Number).sort((a, b) => a - b);
      if (keys.length) viewX.setAnimationFrame(a.name, keys[0] + (keys.at(-1) - keys[0]) * progress);
    } else if (a.type === 'html-css-style') {
      o.element.style.transition = 'none';
      for (const key of Object.keys(o.propertiesAtStart)) o.element.style[key] = interpolate(o.propertiesAtStart[key], o.propertiesAtEnd[key], progress);
      if ('opacity' in o.propertiesAtEnd) o.element.style.pointerEvents = Number(o.element.style.opacity) === 0 ? 'none' : 'auto';
    }
  }
  function sample(time, effects = false) {
    compile();
    const t = Math.max(0, Math.min(scene.duration, time));
    const texts = new Map();
    for (const track of tracks) if (track.animation.type === 'inner-html') texts.set(track.animation.animationOptions.element, '');
    // Reverse reset preserves the earliest authored value of each property.
    for (let i = tracks.length - 1; i >= 0; i--) apply(tracks[i], 0);
    let audioChanged = false;
    for (const track of tracks) {
      if (t < track.start) continue;
      const a = track.animation;
      const progress = a.duration === 0 || t >= track.end - 1e-9 ? 1 : clamp((t - track.start) / a.duration);
      apply(track, a.type === 'inner-html' ? 1 : progress);
      if (a.type === 'inner-html') texts.set(a.animationOptions.element, a.animationOptions.text);
      if (effects && track.start > effectsFrom && track.start <= t && a.type === 'function') a.animationOptions.function();
      if (effects && track.start > effectsFrom && track.start <= t && a.type === 'audio') audioChanged = true;
    }
    for (const [element, text] of texts) if (element.innerHTML !== text) element.innerHTML = text;
    scene.currentTime = t;
    scene.atTime = t;
    if (audioChanged) syncAudio(true);
    scene.animationIndex = tracks.filter(track => t >= track.start).length;
    if (scene.seekBar) {
      scene.seekBar.timeOfAnimation = t;
      scene.seekBar.value = scene.animationIndex;
      scene.seekBar.max = tracks.length;
      scene.seekBar.updateSlider();
    }
    if (effects) effectsFrom = t;
    emit();
  }
  function syncAudio(play) {
    const state = new Map();
    for (const track of tracks) {
      if (track.animation.type !== 'audio') continue;
      const o = track.animation.animationOptions;
      if (!state.has(o.element)) state.set(o.element, { action: 'stop', from: 0, start: 0 });
      if (track.start <= scene.currentTime) state.set(o.element, { ...o, start: track.start });
    }
    for (const [element, o] of state) {
      element.pause();
      if (o.action === 'play') {
        const target = (o.from || 0) + scene.currentTime - o.start;
        try { element.currentTime = target; } catch { /* media metadata may not have arrived yet */ }
        if (play) element.play()?.catch(error => { scene.lastAudioError = error; emit(); });
      } else if (o.action === 'stop') element.currentTime = 0;
    }
  }
  function tick(now) {
    if (!scene.playing) return;
    try { sample((now - origin) / 1000, true); }
    catch (error) { scene.lastError = error; scene.pause(); return; }
    if (scene.currentTime >= scene.duration) { scene.playing = false; frame = null; syncAudio(false); emit(); return; }
    frame = requestAnimationFrame(tick);
  }
  scene.seek = seconds => {
    if (!Number.isFinite(seconds)) throw new TypeError('seek time must be finite');
    scene.pause(); sample(seconds); effectsFrom = scene.currentTime; syncAudio(false); return scene;
  };
  scene.pause = () => {
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null; scene.playing = false;
    for (const a of Object.values(scene.animations)) if (a.type === 'audio') a.animationOptions.element.pause();
    emit();
    return { animationIndex: scene.animationIndex || 0, atTime: scene.currentTime, audioPauseTimes: {} };
  };
  scene.resume = () => {
    if (scene.disposed) throw new Error('Scene is disposed');
    scene.pause(); compile();
    if (!tracks.length) return scene;
    origin = performance.now() - scene.currentTime * 1000;
    scene.playing = true; syncAudio(true); emit(); frame = requestAnimationFrame(tick); return scene;
  };
  scene.play = (from = 0) => {
    compile();
    if (!Number.isInteger(from) || from < 0 || from > tracks.length) throw new RangeError('play(from) expects an animation index');
    scene.seek(from === tracks.length ? scene.duration : tracks[from]?.start || 0);
    effectsFrom = scene.currentTime - 1e-9;
    return scene.resume();
  };
  scene.playAnimation = from => scene.play(from);
  scene.resetToFrame = index => { compile(); return scene.seek(tracks[index]?.start ?? scene.duration); };
  scene.clear = () => {
    scene.pause(); scene.epoch++;
    for (const controller of scene.pendingAssets || []) controller.abort();
    api.removeElementsWithTag('<scene>' + scene.name);
    for (const a of Object.values(scene.animations)) {
      if (a.type === 'viewX') { viewX.stopAnimation(a.name); delete viewX.animationData[a.name]; delete viewX.animationIntervals[a.name]; }
    }
    scene.animations = {}; scene.animationIndices = []; scene.animationAdditionIndex = 0;
    scene.animatingElementsAndProperties = {}; scene.seekBar = null;
    scene.currentTime = scene.duration = 0; compiledCount = -1; tracks = []; effectsFrom = -1e-9; emit();
    return scene;
  };
  scene.dispose = () => { scene.clear(); scene.disposed = true; listeners.clear(); delete api.scenes[scene.name]; };
  scene.prepare = () => { compile(); sample(scene.currentTime); return scene; };
}
