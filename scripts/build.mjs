import { build } from 'esbuild';
import { copyFile, mkdir, rm } from 'node:fs/promises';

await rm('dist', { recursive: true, force: true });
await mkdir('dist/licenses', { recursive: true });

const options = {
  bundle: true,
  target: 'es2022',
  sourcemap: true,
  legalComments: 'eof',
  logLevel: 'warning'
};

for (const [entry, output, platform, format] of [
  ['index', 'index.js', 'node', 'esm'],
  ['index', 'index.cjs', 'node', 'cjs'],
  ['browser', 'browser.js', 'browser', 'esm'],
  ['client', 'client.js', 'browser', 'esm'],
  ['worker', 'worker.js', 'browser', 'esm']
]) {
  await build({ ...options, entryPoints: [`src/${entry}.js`], outfile: `dist/${output}`,
    platform, format });
}

for (const entry of ['index', 'browser', 'client', 'worker']) {
  await copyFile(`src/${entry}.d.ts`, `dist/${entry}.d.ts`);
}
await copyFile('src/index.d.ts', 'dist/index.d.cts');

for (const packageName of ['hashes', 'ciphers', 'curves']) {
  await copyFile(`node_modules/@noble/${packageName}/LICENSE`,
    `dist/licenses/noble-${packageName}.LICENSE`);
}
