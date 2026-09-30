import { build } from 'esbuild';
import { copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';

await rm('dist', { recursive: true, force: true });
await mkdir('dist/licenses', { recursive: true });

const options = {
  bundle: true,
  target: 'es2022',
  sourcemap: true,
  legalComments: 'eof',
  logLevel: 'warning'
};

// Node entry: one self-contained ESM file and one CommonJS file.
for (const [output, format] of [['index.js', 'esm'], ['index.cjs', 'cjs']]) {
  await build({ ...options, entryPoints: ['src/index.js'], outfile: `dist/${output}`,
    platform: 'node', format });
}

// Browser entries share their common modules through dist/chunks, so an
// application that imports two of them gets a single copy of that code.
await build({ ...options, entryPoints: ['src/browser.js', 'src/client.js', 'src/worker.js'],
  outdir: 'dist', entryNames: '[name]', chunkNames: 'chunks/[name]-[hash]',
  platform: 'browser', format: 'esm', splitting: true });

// Declarations. The .d.cts copies point their relative imports at .cjs
// names, so a CommonJS consumer never imports an ES module declaration.
const RELATIVE_ENTRY = /(['"])\.\/(index|browser|client|worker)\.js\1/g;
for (const entry of ['index', 'browser', 'client', 'worker']) {
  const declarations = await readFile(`src/${entry}.d.ts`, 'utf8');
  const commonjs = declarations.replace(RELATIVE_ENTRY, '$1./$2.cjs$1');
  if (/(['"])\.\.?\/[^'"]*\.js\1/.test(commonjs)) {
    throw new Error(`src/${entry}.d.ts imports a file without a CommonJS declaration`);
  }
  await writeFile(`dist/${entry}.d.ts`, declarations);
  await writeFile(`dist/${entry}.d.cts`, commonjs);
}

for (const packageName of ['hashes', 'ciphers', 'curves']) {
  await copyFile(`node_modules/@noble/${packageName}/LICENSE`,
    `dist/licenses/noble-${packageName}.LICENSE`);
}
