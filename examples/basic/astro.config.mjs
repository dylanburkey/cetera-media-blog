import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'server',
  // For Cloudflare deployment, add:
  // adapter: cloudflare({ mode: 'directory' }),
});
