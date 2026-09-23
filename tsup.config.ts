import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['cli/index.ts'],
  outDir: 'dist',
  format: ['esm'],
  dts: true,
  clean: true,
  minify: true,
  sourcemap: true,
});
