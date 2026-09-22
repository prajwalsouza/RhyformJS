import { chromium, firefox, webkit } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import assert from 'node:assert/strict';

const root = resolve('.');
const server = createServer(async (req, res) => {
  try {
    const path = resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
    if (!path.startsWith(root + '/')) throw Error('Invalid path');
    const body = await readFile(path);
    res.setHeader('Content-Type', ({'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.svg':'image/svg+xml','.css':'text/css'})[extname(path)] || 'application/octet-stream');
    res.end(body);
  } catch { res.writeHead(404); res.end('Not found'); }
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;
let browser;
const engine = process.env.TEST_BROWSER || 'chromium';
if (engine === 'chromium') {
  try { browser = await chromium.launch({channel:'chrome'}); }
  catch { browser = await chromium.launch(); }
} else browser = await ({firefox,webkit})[engine].launch();
const page = await browser.newPage();
let failures = 0, passed = 0, errors = [];
page.on('pageerror', error => errors.push(error.message));
async function test(name, fn) {
  errors = [];
  await page.goto(base + '/tests/fixture.html');
  try { await fn(); assert.deepEqual(errors, [], 'Uncaught browser errors'); passed++; console.log('PASS ' + name); }
  catch (error) { failures++; console.error('FAIL ' + name + '\n' + error.stack); }
}
const run = fn => page.evaluate(fn);
const wait = ms => new Promise(r => setTimeout(r, ms));
await test('single import: geometry, text, and default legacy slider without optional globals', async () => {
  assert.deepEqual(await run(() => {
    const s = rhyform.scene('#stage');
    rhyform.createText('Hello').show(.1); const slider = rhyform.createSlider(); slider.show(.1);
    s.circle().draw(.1); s.seek(.15);
    return [rhyform.version, typeof MathJax, typeof Potrace, typeof viewX, !!slider.element, document.querySelectorAll('svg').length];
  }), ['0.2.0','undefined','undefined','undefined',true,1]);
});
await test('empty scene, invalid duration, and empty curve give deliberate behavior', async () => {
  assert.deepEqual(await run(() => {
    const s = rhyform.scene('#stage'); s.play();
    const messages = []; for (const fn of [() => s.wait(NaN), () => s.wait(-1), () => rhyform.createCurve()]) { try { fn(); } catch(e) { messages.push(e.message); } }
    return [s.playing, messages.length];
  }), [false,3]);
});
await test('primitive circle hide, singleton curve interpolation, and command-path draw', async () => {
  assert.equal(await run(() => {
    const s = rhyform.scene('#stage'); const p = rhyform.createPoint({x:0,y:0});
    const c = rhyform.createCircle(p, 1); c.show(.1); const hide = c.hide(.1);
    const single = rhyform.createCurve([{x:0,y:0}]); single.loadWith.points([{x:1,y:1}]); single.show(.1); single.change.points([{x:2,y:2}], .1);
    const curve = rhyform.createCurve([{command:'M',x:0,y:0},{command:'L',x:1,y:0},{command:'M',x:2,y:1},{command:'L',x:3,y:1}]);
    curve.draw(1); s.prepare(); s.seek(s.duration / 2); s.seek(s.duration);
    return hide.type === 'viewX' && !/NaN|Infinity|undefined/.test(document.querySelector('svg').outerHTML);
  }), true);
});
await test('point z defaults, symmetric distance, and position bounds', async () => {
  assert.deepEqual(await run(() => {
    rhyform.scene('#stage'); const a=rhyform.createPoint({x:0,y:0}),b=rhyform.createPoint({x:3,y:4});
    const distance=[rhyform.libraryFunctions.distanceBetweenPoints(a,b),rhyform.libraryFunctions.distanceBetweenPoints(b,a)];
    a.set.position(2,3); const set=[a.bounds.xmin,a.bounds.center.y,a.coordinates.z];
    a.change.position({x:5,y:6},1); return [...distance,...set,a.bounds.xmin,a.bounds.center.y];
  }), [5,5,2,3,0,5,6]);
});
await test('pause freezes legacy point movement; replay and seek are deterministic', async () => {
  await run(() => {
    window.s=rhyform.scene('#stage'); const p=rhyform.createPoint({x:-3,y:0}); p.set.opacity(1); p.change.position({x:3,y:0},1);
    s.play();
  });
  await wait(160); const a=await run(() => {s.pause(); return document.querySelector('svg').innerHTML;});
  await wait(200); assert.equal(await run(() => document.querySelector('svg').innerHTML), a);
  assert.equal(await run(() => {s.seek(.5); const a=document.querySelector('svg').innerHTML;s.seek(1);s.seek(.5);return a===document.querySelector('svg').innerHTML;}),true);
});
await test('sequential and overlapping clips have correct total duration', async () => {
  assert.equal(await run(() => {const s=rhyform.scene('#stage');s.circle().show(2).startNextImmediately();s.square().show(1);s.wait(1);s.prepare();return s.duration;}),2);
});
await test('function effects run once during playback and never during seek', async () => {
  await run(() => {window.calls=0;window.s=rhyform.scene('#stage');s.wait(.05);rhyform.runFunction(()=>calls++,.05);s.seek(.1);s.seek(0);s.play();});
  await wait(180); assert.equal(await run(() => calls),1);
  await run(() => {s.seek(0);s.seek(.1);}); assert.equal(await run(() => calls),1);
});
await test('audio cues begin at their scheduled time and pause with the scene', async () => {
  await run(() => {
    window.s=rhyform.scene('#stage'); window.plays=0;window.pauses=0; s.wait(.06);
    const audio=rhyform.createAudio('unused.mp3');audio.play();audio.element.play=()=>{plays++;return Promise.resolve();};audio.element.pause=()=>{pauses++;};s.play();
  });
  assert.equal(await run(() => plays),0);await wait(160);assert.equal(await run(() => plays),1);
  assert.ok(await run(() => {s.pause();return pauses;})>0);
});
await test('all SVG path commands, inherited transforms and local use references import', async () => {
  assert.equal(await run(() => {
    const asset=rhyform.geometry.parseSVG('<svg><defs><path id="p" d="m0 0h2v2l1 0q1 1 2 0t2 0c1 0 1 1 2 1s1 0 2 0a1 1 0 0 1 1 1z"/></defs><g transform="translate(3 4)"><use href="#p" transform="scale(2)"/></g></svg>');
    const first=asset.paths[0].contours[0].points[0]; return first.x===3 && first.y===4 && asset.paths[0].contours[0].closed;
  }),true);
});
await test('SVG holes stay unfilled throughout morph and endpoints preserve original curves', async () => {
  assert.equal(await run(() => {
    const s=rhyform.scene('#stage');
    const svg='<svg viewBox="-2 -2 4 4"><path fill="teal" fill-rule="evenodd" d="M2 0A2 2 0 1 1-2 0A2 2 0 1 1 2 0Z M1 0A1 1 0 1 1-1 0A1 1 0 1 1 1 0Z"/></svg>';
    const target='<svg viewBox="-2 -2 4 4"><path fill="orange" fill-rule="evenodd" d="M-2-2H2V2H-2Z M-1-1H1V1H-1Z"/></svg>';
    const shape=s.svg(svg);shape.show(0);const source=shape.target.paths[0].d;shape.transformTo({svg:target}, {duration:1});const end=shape.target.paths[0].d;
    for(const t of [0,.1,.3,.5,.7,.9,1]) { s.seek(t); const path=shape.element.firstChild; if(path.isPointInFill(new DOMPoint(0,0))) return false; if((path.getAttribute('d').match(/M/g)||[]).length!==2)return false; }
    s.seek(0);if(shape.element.firstChild.getAttribute('d')!==source)return false;s.seek(1);return shape.element.firstChild.getAttribute('d')===end;
  }),true);
});
await test('different topology rejects unless crossfade is explicitly chosen', async () => {
  assert.deepEqual(await run(() => {
    const s=rhyform.scene('#stage');const shape=s.circle();const ring={svg:'<svg viewBox="0 0 4 4"><path fill-rule="evenodd" d="M0 0H4V4H0Z M1 1H3V3H1Z"/></svg>'};
    let rejected=false;try{shape.transformTo(ring);}catch(e){rejected=/topology/.test(e.message);}
    return [rejected,shape.transformTo(ring,{fallback:'crossfade'}).strategy];
  }),[true,'crossfade']);
});
await test('unsupported or malformed SVG fails clearly and imported event handlers never execute', async () => {
  assert.deepEqual(await run(() => {
    rhyform.scene('#stage');window.injected=0;
    const invalid=['<svg><script>window.injected=1</script></svg>','<svg><path d="M0 0L2 2" fill="url(#g)"/></svg>','<svg><rect width="2" height="2" clip-path="url(#c)"/></svg>','<svg><path d="Mxxx"/></svg>','not svg'];
    let errors=0;for(const svg of invalid){try{rhyform.createSVG(svg);}catch{errors++;}}
    rhyform.createSVG('<svg onload="window.injected=1"><circle r="1"/></svg>');return [errors,window.injected];
  }),[5,0]);
});
await test('native SVG draw returns an animation with finite duration; replay restores dash state', async () => {
  assert.equal(await run(() => {
    const s=rhyform.scene('#stage');const shape=s.circle();const draw=shape.draw(.5);shape.transformTo(rhyform.square(),{duration:.5});
    s.seek(.25);const before=shape.element.outerHTML;s.seek(1);s.seek(.25);return draw.type==='custom'&&before===shape.element.outerHTML;
  }),true);
});
await test('separate scenes preserve shape ownership; disposal removes geometry and registry', async () => {
  assert.deepEqual(await run(() => {
    const a=rhyform.scene('#stage',{name:'a'});const shape=a.circle();const b=rhyform.scene('#stage',{name:'b'});shape.show(1);a.prepare();b.prepare();const duration=[a.duration,b.duration];a.dispose();return [...duration,shape.element.isConnected,!!rhyform.scenes.a,!!rhyform.scenes.b];
  }),[1,0,false,false,true]);
});
await test('missing MathJax and raster adapter reject without blocking geometry', async () => {
  assert.deepEqual(await run(async () => {
    const s=rhyform.scene('#stage');const canvas=document.createElement('canvas');canvas.width=canvas.height=8;
    const result=await Promise.allSettled([rhyform.generateEquation('x'),rhyform.generateVectorImage(canvas.toDataURL())]);s.circle().draw();s.seek(.5);return result.map(r=>r.status);
  }),['rejected','rejected']);
});
await test('MathJax startup wait, concurrent equation serialization, and error propagation', async () => {
  assert.deepEqual(await run(async () => {
    rhyform.scene('#stage');let active=0,peak=0;const delay=ms=>new Promise(r=>setTimeout(r,ms));
    const startup=delay(30).then(()=>{MathJax.tex2svgPromise=async expr=>{active++;peak=Math.max(peak,active);await delay(25);active--;if(expr==='bad')throw Error('typeset failed');const d=document.createElement('div');d.innerHTML='<svg viewBox="0 0 1000 1000"><path d="M0 0L1000 0L500 1000Z"/></svg>';return d;};});
    window.MathJax={startup:{promise:startup}};
    const r=await Promise.allSettled([rhyform.generateEquation('a'),rhyform.generateEquation('b'),rhyform.generateEquation('bad')]);return [peak,...r.map(x=>x.status),r[2].reason.message];
  }),[1,'fulfilled','fulfilled','rejected','typeset failed']);
});
await test('clear cancels pending assets immediately and stale results cannot recreate shapes', async () => {
  assert.deepEqual(await run(async () => {
    const s=rhyform.scene('#stage');window.MathJax={startup:{promise:new Promise(()=>{})}};
    const result=rhyform.generateEquation('x').catch(e=>e.name);s.clear();return [await result,s.pendingAssets.size,document.querySelectorAll('[data-rhyform]').length];
  }),['AbortError',0,0]);
});
await test('native slider supports keyboard scrubbing and disposal', async () => {
  await run(()=>{window.s=rhyform.scene('#stage');s.circle().draw(1);window.control=s.slider('#controls');});
  await page.locator('input[type=range]').focus();await page.keyboard.press('End');
  assert.equal(await run(()=>s.currentTime),1);await run(()=>control.remove());assert.equal(await page.locator('#controls input').count(),0);
});
await test('real MathJax SVG: simultaneous equations and changed expression, without tracing', async () => {
  await page.addScriptTag({url:base+'/node_modules/mathjax/es5/tex-svg.js'});
  await page.waitForFunction(()=>typeof MathJax.tex2svgPromise==='function');
  assert.equal(await run(async()=>{
    const s=rhyform.scene('#stage');
    const [a,b]=await Promise.all([rhyform.generateEquation('a^2+b^2',{x:-3,y:1},'teal',2),rhyform.generateEquation('x^2',{x:0,y:-1},'orange',2)]);
    a.addTag('equations');b.addTag('equations');a.show(.1);b.draw(.2);await a.change.expression('a^2+b^2=c^2',.3);rhyform.hideElementsWithTag('equations',.2);s.prepare();s.seek(s.duration);
    return a.asset.paths.length>1&&b.asset.paths.length>1&&a.element.style.opacity==='0'&&b.element.style.opacity==='0'&&typeof Potrace==='undefined';
  }),true);
});
await test('SVG transform scales strokes and rejects unsupported affine stroke distortion', async () => {
  assert.deepEqual(await run(()=>{
    const a=rhyform.geometry.parseSVG('<svg><g transform="scale(3)"><path d="M0 0L1 1" stroke="red" stroke-width="2" stroke-linecap="square"/></g></svg>');
    let rejected=false;try{rhyform.geometry.parseSVG('<svg><path transform="scale(2 3)" stroke="red" d="M0 0L1 1"/></svg>');}catch{rejected=true;}return [a.paths[0].strokeWidth,a.paths[0].linecap,rejected];
  }),[6,'square',true]);
});
await test('real equation descriptors morph compatible glyphs and require an explicit fallback for extra glyphs', async () => {
  await page.addScriptTag({url:base+'/node_modules/mathjax/es5/tex-svg.js'});
  await page.waitForFunction(()=>typeof MathJax.tex2svgPromise==='function');
  assert.deepEqual(await run(async()=>{
    const scene=rhyform.scene('#stage');
    const quadratic=await rhyform.equation('f(x)=x^2');
    const cubic=await rhyform.equation('f(x)=x^3');
    const derivative=await rhyform.equation("f'(x)=3x^2");
    const count=document.querySelectorAll('[data-rhyform]').length;
    const shape=scene.shape(quadratic);shape.show(0);
    const morph=shape.transformTo(cubic,{duration:1});
    let rejected=false;try{shape.transformTo(derivative);}catch(e){rejected=/topology/.test(e.message);}
    const fallback=shape.transformTo(derivative,{duration:1,fallback:'crossfade'});
    for(const t of [0,.25,.5,.75,1]) {
      scene.seek(t);
      if(shape.element.children.length!==quadratic.paths.length||[...shape.element.children].some(p=>p.getAttribute('opacity')!=='1'))throw Error('Unexpected glyph fade');
      if(/NaN|Infinity/.test(shape.element.outerHTML))throw Error('Invalid coordinates');
    }
    scene.seek(.5);const mid=shape.element.innerHTML;scene.seek(2);scene.seek(.5);
    const replay=shape.element.innerHTML===mid;
    scene.seek(1.5);const faded=[...shape.element.children].every(p=>+p.getAttribute('opacity')===.5);
    scene.seek(2);const endpoint=[...shape.element.children].every((p,i)=>p.getAttribute('d')===derivative.paths[i].d);
    return [count,quadratic.kind,morph.strategy,rejected,fallback.strategy,replay,faded,endpoint,typeof Potrace];
  }),[0,'equation','contour-morph',true,'crossfade',true,true,true,'undefined']);
});
await test('real MathJax pi morphs to a disk, square, and back without a crossfade', async () => {
  await page.addScriptTag({url:base+'/node_modules/mathjax/es5/tex-svg.js'});
  await page.waitForFunction(()=>typeof MathJax.tex2svgPromise==='function');
  assert.equal(await run(async()=>{
    const scene=rhyform.scene('#stage');const pi=await rhyform.equation('\\pi',{width:3});
    const disk=rhyform.circle({radius:1.5,fill:'teal',stroke:'none'});
    const square=rhyform.square({size:3,fill:'orange',stroke:'none'});
    const shape=scene.shape(pi);shape.show(0);
    for(const target of [disk,square,pi])if(shape.transformTo(target,{duration:1}).strategy!=='contour-morph')return false;
    for(const t of [0,.25,.5,.75,1,1.5,2,2.5,3]) {
      scene.seek(t);const path=shape.element.firstChild;
      if(shape.element.children.length!==1||path.getAttribute('opacity')!=='1'||path.getTotalLength()<=0||/NaN|Infinity/.test(path.getAttribute('d')))return false;
    }
    return shape.element.firstChild.getAttribute('d')===pi.paths[0].d;
  }),true);
});
await test('drawing a filled glyph uses its fill color when its authored stroke has zero width', async () => {
  assert.deepEqual(await run(()=>{
    const scene=rhyform.scene('#stage');const glyph=scene.svg('<svg viewBox="0 0 2 2"><path fill="teal" stroke="black" stroke-width="0" d="M0 0H2V2H0Z"/></svg>');glyph.draw(1);
    scene.seek(.5);const mid=glyph.element.firstChild;const values=[mid.getAttribute('stroke'),+mid.getAttribute('stroke-width')>0];
    scene.seek(1);return [...values,glyph.element.firstChild.getAttribute('stroke'),glyph.element.firstChild.getAttribute('stroke-width')];
  }),['teal',true,'black','0']);
});
await test('equal contour counts with incompatible nesting reject instead of closing holes', async () => {
  assert.equal(await run(()=>{
    const a=rhyform.geometry.parseSVG('<svg><path fill-rule="evenodd" d="M0 0H4V4H0Z M1 1H3V3H1Z"/></svg>');
    const b=rhyform.geometry.parseSVG('<svg><path fill-rule="evenodd" d="M0 0H4V4H0Z M5 1H7V3H5Z"/></svg>');
    try{rhyform.geometry.prepareMorph(a,b);return false;}catch{return true;}
  }),true);
});
await test('plain HTML with a head import and no library CSS is enough', async () => {
  await page.goto(base+'/tests/standalone.html');
  assert.equal(await run(()=>{
    const shape=document.querySelector('[data-rhyform]');const bounds=shape.getBoundingClientRect();
    return bounds.width>100&&bounds.height>100&&!/NaN|Infinity/.test(shape.outerHTML)&&document.querySelector('#controls input').max==='3';
  }),true);
});
await test('cancelling an in-flight MathJax job does not overlap the next typeset', async () => {
  assert.deepEqual(await run(async()=>{
    const s=rhyform.scene('#stage');let active=0,peak=0;let started;
    const began=new Promise(r=>started=r);
    window.MathJax={tex2svgPromise:async()=>{active++;peak=Math.max(peak,active);started();await new Promise(r=>setTimeout(r,70));active--;const d=document.createElement('div');d.innerHTML='<svg viewBox="0 0 1000 1000"><path d="M0 0L1000 1000L0 1000Z"/></svg>';return d;}};
    const first=rhyform.generateEquation('a').catch(e=>e.name);await began;s.clear();const next=rhyform.generateEquation('b');const cancelled=await first;await next;return [cancelled,peak,document.querySelectorAll('[data-rhyform]').length];
  }),['AbortError',1,1]);
});
await test('group fades run together, text replay is stable, and scene disposal removes built-in controls', async () => {
  assert.deepEqual(await run(()=>{
    const s=rhyform.scene('#stage');const a=s.circle().addTag('all');const text=rhyform.createText('Hello').addTag('all');text.write(10).startNextImmediately();a.show(.5);rhyform.hideElementsWithTag('all',.2);s.prepare();const duration=s.duration;s.slider('#controls');s.seek(duration);const hidden=[a.element.style.opacity,text.element.style.opacity];s.seek(0);s.seek(duration);const content=text.element.textContent;s.dispose();return [duration,...hidden,content,document.querySelectorAll('#controls input').length];
  }),[.7,'0','0','Hello',0]);
});
await test('existing SVG file imports all paths; movement preserves curve commands and colors', async () => {
  assert.deepEqual(await run(async()=>{
    const s=rhyform.scene('#stage');const artwork=await rhyform.loadSVG('/images/rhyform.svg',{scene:s,width:4.5});
    const before=artwork.target.paths.map(p=>({commands:p.d.match(/[a-df-z]/ig).join(''),fill:p.fill}));
    artwork.draw(.2);const move=artwork.moveTo([1,0],1);s.seek(.7);
    const after=artwork.asset.paths.map(p=>({commands:p.d.match(/[a-df-z]/ig).join(''),fill:p.fill}));
    return [artwork.asset.paths.length,move.strategy,JSON.stringify(before)===JSON.stringify(after),artwork.asset.bounds[0]];
  }),[23,'translate',true,-1.75]);
});
await test('minified distribution works with the same one-script contract', async () => {
  await page.route('**/rhyform.js', route=>route.fulfill({path:resolve('rhyform.min.js'),contentType:'text/javascript'}));
  await page.reload();assert.equal(await run(()=>{const s=rhyform.scene('#stage');s.circle().draw(1);s.seek(.5);return s.currentTime;}),.5);
  await page.unroute('**/rhyform.js');
});
await test('fractional algebra matches retained glyphs and fades only entering or leaving parts', async () => {
  await page.addScriptTag({url:base+'/node_modules/mathjax/es5/tex-svg.js'});
  await page.waitForFunction(()=>typeof MathJax.tex2svgPromise==='function');
  const result=await run(async()=>{
    const scene=rhyform.scene('#stage');
    const tex=[String.raw`x^2+\frac{3}{2}x=1`,String.raw`x^2+\frac{3}{2}x+\frac{9}{16}=\frac{25}{16}`,String.raw`\left(x+\frac{3}{4}\right)^2=\frac{25}{16}`,String.raw`x+\frac{3}{4}=\pm\frac{5}{4}`,String.raw`x=-\frac{3}{4}\pm\frac{5}{4}`,String.raw`x\in\left\{-2,\frac{1}{2}\right\}`];
    const states=[];for(const expression of tex)states.push(await rhyform.equation(expression));
    const shape=scene.shape(states[0]);shape.show(0);
    const clips=states.slice(1).map(target=>shape.transformTo(target,{duration:1,match:'glyphs'}));
    const checks=clips.map((clip,i)=>{
      scene.seek(i+.5);
      const opaque=[...shape.element.children].filter(p=>p.getAttribute('opacity')==='1').length;
      const finite=!/NaN|Infinity/.test(shape.element.innerHTML);
      const mid=shape.element.innerHTML;scene.seek(i+1);
      const exact=[...shape.element.children].every((p,j)=>p.getAttribute('d')===states[i+1].paths[j].d);
      scene.seek(i+.5);
      return {strategy:clip.strategy,matched:clip.correspondence.matched,opaque,finite,exact,replay:mid===shape.element.innerHTML};
    });
    return {checks,rule:states[0].paths.some(p=>p.glyph==='rule'),symbols:states[0].paths.every(p=>!!p.glyph),x:states[0].paths.some(p=>p.glyph==='1D465'&&p.mathType==='mi'),exponent:states[0].paths.some(p=>p.glyph==='32'&&p.mathRole==='exponent')};
  });
  assert.equal(result.rule,true);
  assert.equal(result.symbols,true);assert.equal(result.x,true);assert.equal(result.exponent,true);
  assert.ok(result.checks.every(c=>c.strategy==='glyph-match'&&c.matched>0&&c.matched===c.opaque&&c.finite&&c.exact&&c.replay));
});
await test('parameters update live geometry while paused, through keyboard input, and during playback', async () => {
  await run(()=>{
    window.s=rhyform.scene('#stage');window.amplitude=s.parameter('Amplitude',{value:1,min:.2,max:2,step:.1});
    window.shape=s.liveShape(()=>rhyform.circle({radius:amplitude.value,at:[s.currentTime,0]}));
    shape.show(0);s.wait(3);s.controls('#controls');s.seek(.25);
  });
  const input=page.getByRole('slider',{name:'Amplitude',exact:true});
  await input.focus();await page.keyboard.press('End');
  assert.deepEqual(await run(()=>[amplitude.value,shape.bounds.xmax-shape.bounds.xmin,s.currentTime,s.playing]),[2,4,.25,false]);
  assert.equal(await input.getAttribute('aria-valuetext'),'2');
  await page.getByRole('button',{name:'Play scene',exact:true}).click();await wait(140);
  const live=await run(()=>{amplitude.value=.5;return {width:shape.bounds.xmax-shape.bounds.xmin,playing:s.playing,time:s.currentTime,error:s.lastError?.message};});
  assert.ok(Math.abs(live.width-1)<1e-9&&live.playing&&live.time>.25,JSON.stringify(live));
  await page.getByRole('button',{name:'Pause scene',exact:true}).click();
  const time=await run(()=>s.currentTime);await wait(80);assert.equal(await run(()=>s.currentTime),time);
  assert.equal(await run(()=>{s.seek(.4);const at=shape.element.innerHTML;s.seek(.8);s.seek(.4);return at===shape.element.innerHTML;}),true);
  await page.getByRole('button',{name:'Restart',exact:true}).click();
  assert.equal(await run(()=>amplitude.value),.5);
});
await test('parameter validation, scene ownership, and clear remove all live bindings and controls', async () => {
  assert.deepEqual(await run(()=>{
    const s=rhyform.scene('#stage');let evaluations=0;
    const radius=s.parameter('Radius');const shape=s.liveShape(()=>{evaluations++;return rhyform.circle({radius:radius.value});});
    shape.show(0);s.wait(1);s.controls('#controls');
    let invalid=0;for(const fn of [()=>s.parameter('bad',{min:1,max:1}),()=>{radius.value=NaN;},()=>shape.transformTo(rhyform.square())]){try{fn();}catch{invalid++;}}
    const other=rhyform.scene('#stage');try{other.controls('#controls',{parameters:[radius]});}catch{invalid++;}
    s.clear();const before=evaluations;s.seek(0);let stale=false;try{radius.value=2;}catch{stale=true;}
    return [invalid,stale,before===evaluations,shape.removed,document.querySelectorAll('#controls input').length];
  }),[4,true,true,true,0]);
});
await test('procedural scene coordinates preserve upward positive y', async () => {
  assert.equal(await run(()=>{
    const curve=rhyform.procedural(t=>[t,t],{closed:false,width:2,coordinates:'scene'});
    const points=curve.paths[0].contours[0].points;
    return points.at(-1).x>points[0].x&&points.at(-1).y>points[0].y;
  }),true);
});
await test('semantic equation matching moves x, preserves fraction roles, and never fades during a derivation', async () => {
  await page.addScriptTag({url:base+'/node_modules/mathjax/es5/tex-svg.js'});
  await page.waitForFunction(()=>typeof MathJax.tex2svgPromise==='function');
  assert.equal(await run(async()=>{
    const scene=rhyform.scene('#stage');
    const tex=[String.raw`x^2+\frac{3}{2}x=1`,String.raw`x^2+\frac{3}{2}x+\frac{9}{16}=\frac{25}{16}`,String.raw`\left(x+\frac{3}{4}\right)^2=\frac{25}{16}`,String.raw`x+\frac{3}{4}=\pm\frac{5}{4}`,String.raw`x=-\frac{3}{4}\pm\frac{5}{4}`,String.raw`x\in\left\{-2,\frac{1}{2}\right\}`];
    const states=[];for(const expression of tex)states.push(await rhyform.equation(expression));
    const shape=scene.shape(states[0]);shape.show(0);
    const clips=states.slice(1).map(target=>shape.transformTo(target,{duration:1,match:'semantic'}));
    for(const [i,clip] of clips.entries()) {
      if(clip.strategy!=='semantic-match'||!clip.correspondence.pairs.some(p=>p.sourceGlyph==='1D465'&&p.targetGlyph==='1D465'))return false;
      for(const t of [.01,.25,.5,.75,.99]) {
        scene.seek(i+t);
        if([...shape.element.children].some(p=>p.getAttribute('opacity')!=='1'||p.getAttribute('fill-opacity')!=='1'||/NaN|Infinity/.test(p.getAttribute('d'))))return false;
      }
      scene.seek(i+.5);const mid=shape.element.innerHTML;scene.seek(i+1);
      if([...shape.element.children].some((p,j)=>p.getAttribute('d')!==states[i+1].paths[j].d))return false;
      scene.seek(i+.5);if(shape.element.innerHTML!==mid)return false;
    }
    // When both numerator and denominator survive, repeated glyphs stay in role.
    const a=await rhyform.equation(String.raw`\frac{x+1}{x+2}`),b=await rhyform.equation(String.raw`\frac{x+3}{x+4}`);
    const mapping=scene.shape(a).transformTo(b,{match:'semantic'}).correspondence.pairs;
    return mapping.filter(p=>p.sourceGlyph==='1D465').length===2&&mapping.filter(p=>p.sourceGlyph==='1D465').every(p=>a.paths[p.from].mathRole===b.paths[p.to].mathRole);
  }),true);
});
await test('structural matching does not reshape parentheses into arithmetic operators', async () => {
  await page.addScriptTag({url:base+'/node_modules/mathjax/es5/tex-svg.js'});
  await page.waitForFunction(()=>typeof MathJax.tex2svgPromise==='function');
  assert.equal(await run(async()=>{
    const s=rhyform.scene('#stage');const from=await rhyform.equation('(x)'),to=await rhyform.equation(String.raw`x\pm1`);
    const mapping=s.shape(from).transformTo(to,{match:'semantic'}).correspondence;
    return mapping.pairs.length===1&&mapping.pairs[0].sourceGlyph==='1D465'&&mapping.entering===2&&mapping.leaving===2;
  }),true);
});
await browser.close();server.close();
console.log(`\n${passed} passed, ${failures} failed (${engine}).`);
process.exitCode=failures?1:0;
