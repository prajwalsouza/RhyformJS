import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { extname } from 'node:path';
import assert from 'node:assert/strict';

const json = async file => JSON.parse(await readFile(file, 'utf8'));
const pkg = await json('package.json'), lock = await json('package-lock.json');
const source = await readFile('src/index.js', 'utf8');
assert.match(pkg.version, /^\d+\.\d+\.\d+$/);
assert.equal(lock.version, pkg.version, 'Lockfile version differs');
assert.equal(lock.packages[''].version, pkg.version, 'Lockfile root version differs');
assert.equal(source.match(/api\.version\s*=\s*['"]([^'"]+)/)?.[1], pkg.version, 'Runtime version differs');
assert.equal(pkg.private, true, 'npm publishing is not part of this browser release');
if (process.env.GITHUB_REF_TYPE === 'tag') assert.equal(process.env.GITHUB_REF_NAME, `v${pkg.version}`, 'Tag must match the release version');

const files = [...new Set(execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean))];
const privatePath = /^(?:planning-and-development|node_modules|test-results|playwright-report)\/|(?:^|\/)\.env(?:\.|$)|(?:^|\/)\.DS_Store$/;
const privateText = /\/Users\/|\/Volumes\/|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|AKIA[0-9A-Z]{16})\b/;
const textExtensions = new Set(['', '.js', '.mjs', '.md', '.json', '.html', '.css', '.yml', '.yaml', '.svg']);
for (const file of files) {
  assert.ok(file.endsWith('.env.example') || !privatePath.test(file), `Private artifact in publication set: ${file}`);
  if (textExtensions.has(extname(file))) assert.ok(!privateText.test(await readFile(file, 'utf8')), `Potential private content in ${file}; inspect locally`);
}
const ignored = execFileSync('git', ['ls-files', '-ci', '--exclude-standard'], { encoding: 'utf8' }).trim();
assert.equal(ignored, '', 'Ignored files are already tracked');
for (const file of ['rhyform.js', 'rhyform.min.js', 'rhyform-3d.js', 'rhyform-3d.min.js', 'rhyform-3d.module.js']) {
  const bundle = await readFile(file, 'utf8');
  if (file.includes('-3d')) for (const notice of ['three.js authors', 'Mapbox']) assert.ok(bundle.includes(notice), `${file} is missing ${notice}'s license notice`);
  for (const notice of ['2023 Prajwal DSouza', '2021 Prajwal DSouza', 'Vitaly Puzrin']) assert.ok(bundle.includes(notice), `${file} is missing ${notice}'s license notice`);
}
console.log(`Release v${pkg.version}: versions, ${files.length} publication paths, private-content patterns, and embedded notices checked.`);
