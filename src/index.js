import createViewX from '../vendor/viewx.js';
import createLegacy from './legacy.js';
import * as svgTools from './svg.js';
import { installTimeline } from './timeline.js';
import { installShapes } from './shapes.js';
import { installAssets } from './assets.js';

const viewX = createViewX();
const api = createLegacy(viewX, svgTools, installTimeline);
installShapes(api, viewX);
installAssets(api);
api.version = '0.2.1';
// Deterministic geometry helpers are public for custom procedural authoring and tests.
api.geometry = { parseSVG: svgTools.parseSVG, fit: svgTools.fitAsset, prepareMorph: svgTools.prepareMorph };
export default api;
