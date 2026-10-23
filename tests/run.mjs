// Runs every *.test.mjs against the tools in the repo root, in headless Chrome.
//   node tests/run.mjs            all tests
//   node tests/run.mjs pixel      only tests whose file name contains "pixel"
import { mkdtempSync, readFileSync, writeFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const work = mkdtempSync(join(tmpdir(), 'forge-tests-'));
const pages = join(work, 'pages');
spawnSync(process.platform === 'win32' ? 'cmd' : 'mkdir', process.platform === 'win32' ? ['/c', 'mkdir', pages] : ['-p', pages]);

// Test copies of the tools. Pixel Forge keeps its state inside a closure, so its
// copy gets a tiny hook that exposes the internals the tests inspect.
const copies = {
  'pixel.html': 'pixel-forge.html', 'mesh.html': 'AnimMeshForge.html', 'bone.html': 'bone-forge.html',
  'anim.html': 'AnimForge.html', 'sprite.html': 'sprite-forge.html', 'particle.html': 'particle-editor-en.html',
  'fluid.html': 'fluid-forge.html',
};
for (const [dst, src] of Object.entries(copies)) {
  let html = readFileSync(join(root, src), 'utf8');
  if (dst === 'pixel.html') {
    const i = html.lastIndexOf('})();\n</script>');
    html = html.slice(0, i) + 'window.__T={S,getPx,undo,redo,renderMain};\n' + html.slice(i);
  }
  writeFileSync(join(pages, dst), html);
}

const filter = process.argv[2] || '';
const tests = readdirSync(here).filter(f => f.endsWith('.test.mjs') && f.includes(filter)).sort();
let failed = 0;
for (const t of tests) {
  console.log(`\n▶ ${t}`);
  const r = spawnSync(process.execPath, [join(here, t), work], { stdio: 'inherit', timeout: 180000 });
  if (r.status !== 0) failed++;
}
rmSync(work, { recursive: true, force: true });
console.log(`\n${tests.length - failed}/${tests.length} test files passed`);
process.exit(failed ? 1 : 0);
