// Keeps the versions written in the docs equal to the versions pinned in package.json.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const frontend = JSON.parse(read('frontend/package.json'));
const backend = JSON.parse(read('backend/package.json'));

const pins = {
  'Next.js': frontend.dependencies.next,
  React: frontend.dependencies.react,
  TypeScript: frontend.devDependencies.typescript,
  Express: backend.dependencies.express,
  'MongoDB Node.js driver': backend.dependencies.mongodb
};

test('README stack table matches the pinned versions', () => {
  const readme = read('README.md');
  for (const [name, version] of Object.entries(pins)) {
    assert.ok(readme.includes(`| ${name} | ${version}`), `README.md should list ${name} ${version}`);
  }
});

test('HowToSetup.md and the part READMEs name the pinned versions', () => {
  const setup = read('HowToSetup.md');
  for (const [name, version] of Object.entries(pins)) {
    if (name === 'TypeScript') continue;
    assert.ok(setup.includes(`${name} ${version}`), `HowToSetup.md should say ${name} ${version}`);
  }
  assert.ok(read('frontend/README.md').includes(`Next.js ${pins['Next.js']} and React ${pins.React}`));
  assert.ok(read('backend/README.md').includes(`Express ${pins.Express} and the MongoDB Node.js driver ${pins['MongoDB Node.js driver']}`));
});

test('HowToSetup.md lists prerequisites and the setup steps in order', () => {
  const setup = read('HowToSetup.md');
  assert.match(setup, /Node\.js 20\.13/);
  assert.match(setup, /MongoDB/);
  const order = ['npm ci', 'backend/.env.example', 'npm run db:setup', 'npm run dev'].map((step) => setup.indexOf(step));
  assert.ok(order.every((at) => at >= 0), 'every setup step is present');
  assert.deepStrictEqual([...order].sort((a, b) => a - b), order, 'steps appear in order');
  assert.match(setup, /required in production/);
});

test('the Render build command can run in backend/ without a backend lockfile', () => {
  assert.ok(!fs.existsSync(path.join(root, 'backend/package-lock.json')), 'only the root lockfile is kept');
  assert.doesNotMatch(read('render.yaml'), /buildCommand:\s*npm ci/);
});
