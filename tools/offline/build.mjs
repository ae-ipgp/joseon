// Offline build and test runner for joseon-game, for machines without the npm registry.
// With npm available, ignore this folder and use `npm run build` / `npm test`.
//   node build.mjs build   → out/joseon.html (single file: JS, CSS and favicon inlined)
//   node build.mjs test    → bundles each src/**/*.test.ts with a vitest stand-in and runs it
import * as esbuild from '/opt/npm-tools/node_modules/esbuild/lib/main.js';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const TOOLS = path.dirname(new URL(import.meta.url).pathname);
const GAME = path.resolve(TOOLS, '../..');
const OUT = path.join(TOOLS, 'out');
const shim = {
  zustand: path.join(TOOLS, 'shims/zustand.ts'),
  'lucide-react': path.join(TOOLS, 'shims/lucide-react.tsx'),
  vitest: path.join(TOOLS, 'shims/vitest.ts'),
};
const shimPlugin = {
  name: 'shims',
  setup(b) {
    b.onResolve({ filter: /^(zustand|lucide-react|vitest)$/ }, (a) => ({ path: shim[a.path] }));
  },
};
const common = {
  bundle: true,
  plugins: [shimPlugin],
  nodePaths: ['/opt/npm-tools/node_modules'],
  jsx: 'automatic',
  logLevel: 'warning',
  loader: { '.svg': 'text' },
};

const walk = (d, test) =>
  fs.readdirSync(d).flatMap((f) => {
    const p = path.join(d, f);
    return fs.statSync(p).isDirectory() ? walk(p, test) : test(p) ? [p] : [];
  });

async function build() {
  const r = await esbuild.build({
    ...common,
    entryPoints: [path.join(GAME, 'src/main.tsx')],
    outdir: OUT,
    write: false,
    format: 'iife',
    minify: true,
    target: 'es2020',
    define: { 'process.env.NODE_ENV': '"production"', 'import.meta.env.DEV': 'false', 'import.meta.env.PROD': 'true', 'import.meta.env': '{"PROD":false,"DEV":false,"BASE_URL":"./"}' },
  });
  const js = r.outputFiles.find((f) => f.path.endsWith('.js')).text;
  const css = r.outputFiles.find((f) => f.path.endsWith('.css'))?.text ?? '';
  const icon = fs.readFileSync(path.join(GAME, 'public/favicon.svg'));
  let html = fs.readFileSync(path.join(GAME, 'index.html'), 'utf8');
  html = html
    .replace('href="/favicon.svg"', () => `href="data:image/svg+xml;base64,${icon.toString('base64')}"`)
    // A single file has no manifest or service worker beside it.
    .replace(/\s*<link rel="manifest"[^>]*>/, '')
    .replace('<script type="module" src="/src/main.tsx"></script>', () => `<script>${js.replace(/<\/script/gi, '<\\/script')}</script>`)
    .replace('</head>', () => `<style>${css}</style>\n  </head>`);
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, 'joseon.html'), html);
  console.log(`out/joseon.html ${(html.length / 1024).toFixed(0)} KB`);
}

async function test(filter) {
  const files = walk(path.join(GAME, 'src'), (p) => p.endsWith('.test.ts')).filter((f) => !filter || f.includes(filter));
  const dir = path.join(OUT, 'tests');
  fs.mkdirSync(dir, { recursive: true });
  let pass = 0;
  let total = 0;
  for (const f of files) {
    const name = path.relative(GAME, f);
    const outfile = path.join(dir, name.replace(/[\\/]/g, '_') + '.mjs');
    await esbuild.build({
      ...common,
      stdin: {
        contents: `import ${JSON.stringify(f)};\nimport { __run } from 'vitest';\nconst r = await __run(${JSON.stringify(name)});\nconsole.log('@@' + JSON.stringify(r));`,
        resolveDir: GAME,
        loader: 'ts',
      },
      outfile,
      platform: 'node',
      format: 'esm',
    });
    const out = execFileSync('node', [outfile], { encoding: 'utf8' });
    const line = out.split('\n').find((l) => l.startsWith('@@'));
    process.stdout.write(out.split('\n').filter((l) => !l.startsWith('@@')).join('\n'));
    const r = JSON.parse(line.slice(2));
    pass += r.pass;
    total += r.total;
  }
  console.log(`${pass}/${total} tests pass`);
  if (pass !== total) process.exitCode = 1;
}

const [mode, arg] = process.argv.slice(2);
if (mode === 'build') await build();
else if (mode === 'test') await test(arg);
else console.log('usage: node build.mjs build|test [filter]');
