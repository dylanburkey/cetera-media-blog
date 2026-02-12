import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts', 
    'src/config.ts', 
    'src/lib/auth.ts', 
    'src/lib/settings.ts',
    'src/utils/blog.ts'
  ],
  format: ['esm'],
  dts: true,
  clean: true,
  external: ['astro'],
  treeshake: true,
  sourcemap: true,
});
