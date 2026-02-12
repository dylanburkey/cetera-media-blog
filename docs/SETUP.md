# Setup Guide

Complete guide to setting up Astro Blog CMS in your project.

## Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- Cloudflare account with:
  - D1 database
  - R2 bucket (for image uploads)

## Installation

```bash
pnpm add @dylanburkey/astro-blog-cms
```

## Quick Setup

### 1. Copy Admin Pages

```bash
# Copy the admin pages to your project
cp -r node_modules/@dylanburkey/astro-blog-cms/src/pages/admin src/pages/
cp -r node_modules/@dylanburkey/astro-blog-cms/src/layouts src/
cp -r node_modules/@dylanburkey/astro-blog-cms/src/lib src/
```

### 2. Run Database Migrations

```bash
# Create blog tables
wrangler d1 execute YOUR_DB_NAME --file=node_modules/@dylanburkey/astro-blog-cms/migrations/0001_blog_schema.sql

# Add engagement tracking (optional)
wrangler d1 execute YOUR_DB_NAME --file=node_modules/@dylanburkey/astro-blog-cms/migrations/0002_blog_engagement.sql
```

### 3. Configure Wrangler

Add to your `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "your-database"
database_id = "your-database-id"

[[r2_buckets]]
binding = "ASSETS_BUCKET"
bucket_name = "your-bucket"
```

### 4. Create Admin User

Generate a password hash and insert into the database:

```javascript
// Run this in Node.js or browser console
import { hashPassword } from '@dylanburkey/astro-blog-cms';

const hash = await hashPassword('your-secure-password');
console.log(hash);
```

Then insert the user:

```bash
wrangler d1 execute YOUR_DB_NAME --command="INSERT INTO admin_users (email, password_hash, name, role) VALUES ('admin@example.com', 'YOUR_HASH_HERE', 'Admin', 'admin')"
```

### 5. Configure Astro for SSR

```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  output: 'server',
  adapter: cloudflare({ mode: 'directory' }),
});
```

### 6. Start Development

```bash
pnpm dev
```

Visit `http://localhost:4321/admin` to access the CMS.

## Customization

### Branding

Customize the admin layout by passing props:

```astro
---
import AdminLayout from '../layouts/AdminLayout.astro';
---

<AdminLayout 
  title="Blog Posts"
  siteName="My Brand Admin"
  logoPath="/my-logo.png"
  basePath="/admin"
>
  <!-- Your content -->
</AdminLayout>
```

### Styling

Override CSS variables in your global styles:

```css
:root {
  --color-primary: #your-brand-color;
  --color-surface: #1a1a1a;
  --color-background: #0a0a0a;
}
```

## Next Steps

- [Editor Guide](./EDITOR.md) - Learn the WYSIWYG editor features
- [API Reference](./API.md) - API endpoints documentation
- [Customization](./CUSTOMIZATION.md) - Advanced customization options
