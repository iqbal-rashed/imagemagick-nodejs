import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['cjs'],
    dts: true,
    splitting: false,
    sourcemap: false,
    clean: true,
    outDir: 'dist',
    target: 'node18',
    shims: true,
    treeshake: true,
    minify: true,
  },
  {
    entry: ['src/index.ts'],
    format: ['esm'],
    dts: false,
    splitting: false,
    sourcemap: false,
    clean: true,
    outDir: 'dist',
    target: 'node18',
    shims: true,
    treeshake: true,
    minify: true,
  },
]);
