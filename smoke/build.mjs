// Builds the two smoke-test bundles with esbuild:
// - dist/server.mjs: the playground's TSX sources compiled for Node,
//   with react/react-dom left external so the run uses the exact
//   pinned packages in this playground's node_modules (19.3.1).
// - dist/client.js: the hydration entry bundled for the browser,
//   with NODE_ENV pinned to development so the browser run matches
//   the development-mode behaviour the draft's captured output and
//   the Vitest suites exercised.
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));

await build({
  entryPoints: [path.join(here, 'entry-server.tsx')],
  bundle: true,
  packages: 'external',
  platform: 'node',
  format: 'esm',
  jsx: 'automatic',
  outfile: path.join(here, 'dist', 'server.mjs'),
  logLevel: 'info',
});

await build({
  entryPoints: [path.join(here, 'entry-client.tsx')],
  bundle: true,
  platform: 'browser',
  format: 'esm',
  jsx: 'automatic',
  define: { 'process.env.NODE_ENV': '"development"' },
  outfile: path.join(here, 'dist', 'client.js'),
  logLevel: 'info',
});

console.log('smoke bundles built');
