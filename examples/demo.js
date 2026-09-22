/* Each function below is both executed and displayed. The source panel is the actual scene code. */
function shapeStudy() {
  const scene = rhyform.scene('#stage');

  // Describe the shapes.
  const circle = rhyform.circle({ radius: 1.7 });
  const square = rhyform.square({
    size: 3.4, fill: '#d4a35d'
  });
  const bloom = rhyform.procedural(t => {
    const angle = t * 2 * Math.PI;
    const r = 1.5 + 0.35 * Math.cos(5 * angle);
    return [r * Math.cos(angle), r * Math.sin(angle)];
  }, { width: 4, fill: '#77aaa1' });

  // Tell the story.
  const shape = scene.shape(circle);
  shape.draw(1.2);
  scene.wait(0.5);
  shape.transformTo(square, { duration: 1.8 });
  scene.wait(0.7);
  shape.transformTo(bloom, { duration: 2 });
  scene.wait(0.8);
  shape.transformTo(circle, { duration: 1.6 });
  scene.wait(0.6);
  scene.slider('#controls');
  scene.play();
  return scene;
}

function holeStudy() {
  const scene = rhyform.scene('#stage');
  const ring = { width: 3.8, svg: `<svg viewBox="-2 -2 4 4">
    <path fill="#77aaa1" fill-rule="evenodd" d="
      M2 0 A2 2 0 1 1-2 0 A2 2 0 1 1 2 0 Z
      M1 0 A1 1 0 1 1-1 0 A1 1 0 1 1 1 0 Z"/>
  </svg>` };
  const frame = { width: 3.8, svg: `<svg viewBox="-2 -2 4 4">
    <path fill="#d4a35d" fill-rule="evenodd" d="
      M-1.6-2 H1.6 Q2-2 2-1.6 V1.6 Q2 2 1.6 2
      H-1.6 Q-2 2-2 1.6 V-1.6 Q-2-2-1.6-2 Z
      M-.6-1 H.6 Q1-1 1-.6 V.6 Q1 1 .6 1
      H-.6 Q-1 1-1 .6 V-.6 Q-1-1-.6-1 Z"/>
  </svg>` };

  const shape = scene.shape(ring);
  shape.draw(1.5);
  scene.wait(0.5);
  shape.transformTo(frame, { duration: 2.4 });
  scene.wait(0.8);
  shape.transformTo(ring, { duration: 2.4 });
  scene.wait(0.6);
  scene.slider('#controls');
  scene.play();
  return scene;
}

function waveStudy() {
  const scene = rhyform.scene('#stage');
  const sketch = rhyform.path(
    'M0 0 C1-2 2-2 3 0 S5 2 6 0',
    { width: 5.5, strokeWidth: 0.05 }
  );

  const wave = rhyform.procedural(t => [
    t * 6,
    Math.sin(t * Math.PI * 4)
  ], { closed: false, width: 5.5, strokeWidth: 0.05 });

  const curve = scene.shape(sketch);
  curve.draw(1.5);
  scene.wait(0.5);
  curve.transformTo(wave, { duration: 2.4 });
  scene.wait(0.8);
  curve.moveTo([0, 0.7], 1.2);
  scene.wait(0.6);
  curve.moveTo([0, 0], 1.2);
  scene.wait(0.6);
  scene.slider('#controls');
  scene.play();
  return scene;
}

async function importStudy() {
  const scene = rhyform.scene('#stage');
  const artwork = await rhyform.loadSVG('../images/rhyform.svg', {
    width: 4.5, scene
  });

  artwork.draw(2);
  scene.wait(0.6);
  artwork.moveTo([-1.3, 0], 1.2);
  scene.wait(0.4);
  artwork.moveTo([1.3, 0], 1.8);
  scene.wait(0.4);
  artwork.moveTo([0, 0], 1.2);
  scene.wait(0.8);
  scene.slider('#controls');
  scene.play();
  return scene;
}

async function uploadedStudy() {
  const scene = rhyform.scene('#stage');
  const file = document.querySelector('#svg-file').files[0];
  const svg = await file.text();
  const artwork = scene.svg(svg, { width: 4.5 });

  artwork.draw(2);
  scene.wait(0.6);
  artwork.moveTo([-1.3, 0], 1.2);
  scene.wait(0.4);
  artwork.moveTo([1.3, 0], 1.8);
  scene.wait(0.4);
  artwork.moveTo([0, 0], 1.2);
  scene.wait(0.8);
  scene.slider('#controls');
  scene.play();
  return scene;
}

async function equationStudy() {
  const scene = rhyform.scene('#stage');

  const quadratic = await rhyform.equation('f(x)=x^2');
  const cubic = await rhyform.equation('f(x)=x^3');
  const derivative = await rhyform.equation("f'(x)=3x^2");

  const equation = scene.shape(quadratic);
  equation.draw(1.6);
  scene.wait(0.8);
  equation.transformTo(cubic, { duration: 2.4 });
  scene.wait(1);

  // Keep related symbols connected as the layout changes.
  equation.transformTo(derivative, {
    duration: 2.4, match: 'semantic'
  });
  scene.wait(1.2);
  scene.slider('#controls');
  scene.play();
  return scene;
}

async function mathShapeStudy() {
  const scene = rhyform.scene('#stage');

  const pi = await rhyform.equation('\\pi', { width: 3 });
  const disk = rhyform.circle({
    radius: 1.5, fill: '#77aaa1', stroke: 'none'
  });
  const square = rhyform.square({
    size: 3, fill: '#d4a35d', stroke: 'none'
  });

  const shape = scene.shape(pi);
  shape.draw(1.6);
  scene.wait(0.8);
  shape.transformTo(disk, { duration: 2.4 });
  scene.wait(0.8);
  shape.transformTo(square, { duration: 2 });
  scene.wait(0.8);
  shape.transformTo(pi, { duration: 2.4 });
  scene.wait(1);
  scene.slider('#controls');
  scene.play();
  return scene;
}

async function algebraStudy() {
  const scene = rhyform.scene('#stage');
  const steps = [
    String.raw`x^2+\frac{3}{2}x=1`,
    String.raw`x^2+\frac{3}{2}x+\frac{9}{16}=\frac{25}{16}`,
    String.raw`\left(x+\frac{3}{4}\right)^2=\frac{25}{16}`,
    String.raw`x+\frac{3}{4}=\pm\frac{5}{4}`,
    String.raw`x=-\frac{3}{4}\pm\frac{5}{4}`,
    String.raw`x\in\left\{-2,\frac{1}{2}\right\}`
  ];
  const equations = [];
  for (const tex of steps) {
    equations.push(await rhyform.equation(tex, { width: 6.4 }));
  }

  const equation = scene.shape(equations[0]);
  equation.draw(1.6);
  for (const next of equations.slice(1)) {
    scene.wait(1.2);
    equation.transformTo(next, {
      duration: 2.6, match: 'semantic'
    });
  }
  scene.wait(1.4);
  scene.slider('#controls');
  scene.play();
  return scene;
}

// Only the equation examples request the optional, pinned typesetter.
// Prefer the local npm development copy; a static deployment can use the CDN.
let mathReady;
function ensureMathJax() {
  if (window.MathJax?.tex2svgPromise) return Promise.resolve();
  if (mathReady) return mathReady;
  mathReady = (async () => {
    window.MathJax = { svg: { fontCache: 'local' }, options: { enableMenu: false }, startup: { typeset: false } };
    const add = url => new Promise((resolve, reject) => {
      const script = document.createElement('script'); script.src = url;
      script.onload = resolve; script.onerror = () => { script.remove(); reject(new Error('Could not load MathJax SVG output. Check your connection, or run npm ci for the local copy.')); };
      document.head.appendChild(script);
    });
    try { await add('../node_modules/mathjax/es5/tex-svg.js'); }
    catch { await add('https://cdn.jsdelivr.net/npm/mathjax@3.2.2/es5/tex-svg.js'); }
    await MathJax.startup.promise;
  })().catch(error => { mathReady = null; throw error; });
  return mathReady;
}

const studies = [
  { make: shapeStudy, title: 'Circle → square → bloom', caption: 'One outline. Three ways of being.', description: 'A circle that transforms into a filled square, then a procedural flower', note: 'The same object keeps its identity as its contour and fill change. The final shape comes from a small mathematical function.' },
  { make: holeStudy, title: 'A ring becomes a frame', caption: 'Even the empty space has a shape.', description: 'A filled ring smoothly changes into a square frame while its central hole remains open', note: 'Two contours travel together: the outer edge and the hole. SVG arcs and quadratic curves stay exact at the endpoints; the space inside remains open throughout.' },
  { make: waveStudy, title: 'From a gesture to a function', caption: 'A drawn curve meets a mathematical one.', description: 'A smooth Bézier curve transforms into a sine wave and moves up, then back to the center', note: 'An authored Bézier path transforms into a sampled sine function. The same simple instructions draw it, reshape it, and move it through the scene.' },
  { make: importStudy, title: 'An existing SVG, set in motion', caption: 'Your artwork. A few new instructions.', description: 'The repository’s original Rhyform SVG logo is drawn, then moves left, right, and back to the center', note: 'This loads the existing images/rhyform.svg file. Its paths and colors stay intact as it is drawn and moved. Choose your own SVG to try the same sequence; the file stays in this browser.' },
  { make: equationStudy, math: true, preview: 1.6, title: 'An equation changes its form', caption: 'LaTeX → SVG paths → animation.', description: 'The equation f of x equals x squared morphs to x cubed, then transforms to its derivative, three x squared, with structural symbol matching', note: 'The exponent 2 becomes 3 through a contour morph. The derivative uses structural matching: retained symbols travel, and the extra glyphs grow into place. MathJax supplies the vector outlines; no image tracing or transition crossfade is involved.', cues: [[0, 'Writing the MathJax outlines'], [1.6, 'f(x) = x²'], [2.4, '2 → 3 · contour morph'], [4.8, 'f(x) = x³'], [5.8, 'Derivative · match symbols and their roles'], [8.2, "f′(x) = 3x²"]] },
  { make: mathShapeStudy, math: true, preview: 1.6, title: 'From a math symbol to a shape', caption: 'The same contour learns a new form.', description: 'The MathJax pi symbol morphs into a filled disk, then a square, then back to pi', note: 'π, the disk, and the square each have one closed contour. All three transitions are geometric morphs, with no crossfade. A general multi-glyph equation into an arbitrary shape still needs explicit correspondence or a fallback.', cues: [[0, 'Writing π'], [1.6, 'A symbol, represented as a path'], [2.4, 'π → disk · contour morph'], [4.8, 'A filled disk'], [5.6, 'Disk → square · contour morph'], [7.6, 'A filled square'], [8.4, 'Square → π · contour morph'], [10.8, 'Back to π']] },
  { make: algebraStudy, math: true, preview: 1.6, title: 'Completing the square', caption: 'Follow the symbols through an argument.', description: 'A quadratic equation with fractional coefficients is solved by completing the square, giving the roots minus two and one half', note: 'Symbols are matched by identity, mathematical role, outline, and location. Retained parts travel or reshape; additions grow from related parts and removals retract. No transition fades. The matching is a structural heuristic; the algebraic steps are authored here.', cues: [[0, 'Writing the starting equation'], [1.6, 'A quadratic with fractional coefficients'], [2.8, 'Add 9/16 to both sides'], [6.6, 'Factor the left side as a square'], [10.4, 'Take both square roots'], [14.2, 'Subtract 3/4 from both sides'], [18, 'Simplify: two solutions'], [20.6, 'x = −2 or x = 1/2']] }

];
let currentScene, source = '', selection = 0;
const $ = id => document.getElementById(id);
function highlight(code) {
  const pattern = /(\/\/[^\n]*|'[^'\n]*'|"[^"\n]*"|`[\s\S]*?`|\b(?:const|return|async|await|for|of)\b|\b\d+(?:\.\d+)?\b)/g;
  const fragment = document.createDocumentFragment();
  for (const part of code.split(pattern)) {
    const span = document.createElement('span');span.textContent = part;
    if (/^\/\//.test(part)) span.className='token-comment';
    else if (/^['"`]/.test(part)) span.className='token-string';
    else if (/^(const|return|async|await|for|of)$/.test(part)) span.className='token-keyword';
    else if (/^\d/.test(part)) span.className='token-number';
    fragment.append(span);
  }
  $('code').replaceChildren(fragment);
}
function fail(error) { $('error').hidden=false;$('error').textContent=error.message;$('play').disabled=true;$('restart').disabled=true;$('play-state').textContent='Could not load'; }
async function selectStudy(index, file = null) {
  const ticket = ++selection;
  currentScene?.dispose(); currentScene = null;
  $('controls').replaceChildren();$('stage').replaceChildren();$('error').hidden=true;$('play').disabled=true;$('restart').disabled=true;
  const study=studies[index], make = file ? uploadedStudy : study.make;
  const body=make.toString().split('\n').slice(1,-2).map(line=>line.slice(2)).join('\n');
  source=make.constructor.name==='AsyncFunction' ? '(async () => {\n'+body.split('\n').map(line=>'  '+line).join('\n')+'\n})();' : body;
  highlight(source);
  document.querySelectorAll('[data-study]').forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.study)===index)));
  $('scene-title').textContent=file ? file.name : study.title;$('caption').textContent=study.caption;$('stage').setAttribute('aria-label',file ? 'Your imported SVG is drawn and moves across the scene' : study.description);$('note').textContent=study.note;$('count').textContent=`0${index+1} / 0${studies.length}`;
  $('math-dependency').hidden=!study.math; $('import-tools').hidden=index!==3;$('reset-svg').hidden=!file;$('file-name').textContent=file ? file.name : 'rhyform.svg';$('play-state').textContent='Loading…';
  try {
    if(file && file.size>2_000_000)throw new Error('Choose an SVG smaller than 2 MB.');
    if (study.math) { $('play-state').textContent='Loading MathJax…'; await ensureMathJax(); if(ticket!==selection)return; }
    const result=make();
    // A newly created scene is available before an async import settles. Keep
    // ownership now so switching tabs can cancel it immediately.
    currentScene=rhyform.activeScene;
    const scene=await result;
    if(ticket!==selection){scene.dispose();return;}
    currentScene=scene;
    // A quiet initial preview. Playback always starts with the user's action.
    currentScene.seek(study.preview ?? (index===3?2:index===1?1.5:1.2));
    currentScene.onUpdate(scene=>{
      $('play').replaceChildren(document.createTextNode(scene.playing?'Pause':'Play scene'));
      const icon=document.createElement('span');icon.setAttribute('aria-hidden','true');icon.textContent=scene.playing?'Ⅱ':'▶';$('play').append(icon);
      $('play').setAttribute('aria-label',scene.playing?'Pause scene':'Play scene');
      $('play-state').textContent=scene.playing?'Playing':scene.currentTime>=scene.duration?'Complete':'Paused';
      if(study.cues) $('caption').textContent=study.cues.findLast(cue=>scene.currentTime+1e-9>=cue[0])?.[1] || study.caption;
      if(scene.lastError)fail(scene.lastError);
    });
    currentScene.seek(currentScene.currentTime);$('play-state').textContent='Ready to play';$('play').disabled=false;$('restart').disabled=false;
    if(index===3){const count=document.querySelectorAll('#stage [data-rhyform] path').length;$('file-name').textContent=(file?file.name:'rhyform.svg')+' · '+count+(count===1?' path':' paths');}
  }catch(error){if(ticket===selection){currentScene?.dispose();currentScene=null;fail(error);}}
}
$('choose-svg').addEventListener('click',()=>{ $('svg-file').value='';$('svg-file').click(); });
$('svg-file').addEventListener('change',()=>{ const file=$('svg-file').files[0];if(file)selectStudy(3,file); });
$('reset-svg').addEventListener('click',()=>selectStudy(3));
$('play').addEventListener('click',()=>{
  if(currentScene.playing)currentScene.pause();
  else if($('play-state').textContent==='Ready to play'||currentScene.currentTime>=currentScene.duration)currentScene.play();
  else currentScene.resume();
});
$('restart').addEventListener('click',()=>currentScene.play());
$('copy').addEventListener('click',async()=>{
  try{await navigator.clipboard.writeText(source);$('copy').textContent='Copied';$('announcement').textContent='Scene code copied';setTimeout(()=>$('copy').textContent='Copy code',1600);}
  catch{$('announcement').textContent='Clipboard unavailable. Select the code to copy it.';const range=document.createRange();range.selectNodeContents($('code'));getSelection().removeAllRanges();getSelection().addRange(range);}
});
const studyHashes = ['#shapes', '#holes', '#wave', '#import-svg', '#equations', '#math-to-shape', '#algebra'];
document.querySelectorAll('[data-study]').forEach(button=>button.addEventListener('click',()=>{
  const index = Number(button.dataset.study);
  history.replaceState(null, '', studyHashes[index]);
  selectStudy(index);
}));
const selectFromHash = () => selectStudy(Math.max(0, studyHashes.indexOf(location.hash)));
window.addEventListener('hashchange', selectFromHash);
selectFromHash();
