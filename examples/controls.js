function waveWithControls() {
  const scene = rhyform.scene('#stage');
  const amplitude = scene.parameter('Amplitude', {
    value: 1, min: 0.2, max: 1.6, step: 0.1
  });
  const cycles = scene.parameter('Cycles', {
    value: 2, min: 1, max: 5, step: 1
  });

  const wave = scene.liveShape(() =>
    rhyform.procedural(u => [
      6 * u,
      amplitude.value * Math.sin(2 * Math.PI * (
        cycles.value * u - scene.currentTime / 4
      ))
    ], {
      width: 6, closed: false, coordinates: 'scene'
    })
  );

  wave.show(0);
  scene.wait(8);
  scene.controls('#controls');
  scene.play();
  return scene;
}

const code = waveWithControls.toString().split('\n').slice(1, -2).map(line => line.slice(2)).join('\n');
document.getElementById('code').textContent = code;
try {
  const scene = waveWithControls();
  scene.seek(0); // A quiet initial state, including for reduced-motion preferences.
  scene.onUpdate(() => {
    document.getElementById('play-state').textContent = scene.playing ? 'Playing' : scene.currentTime >= scene.duration ? 'Complete' : 'Paused · keep exploring';
  });
} catch (error) {
  const message = document.getElementById('error');message.hidden = false;message.textContent = error.message;
}
document.getElementById('copy').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(code);
    document.getElementById('announcement').textContent = 'Scene code copied';
    document.getElementById('copy').textContent = 'Copied';
    setTimeout(() => { document.getElementById('copy').textContent = 'Copy code'; }, 1600);
  } catch {
    document.getElementById('announcement').textContent = 'Select the code to copy it.';
  }
});
