# Basic Example

This example shows the minimal setup for using `@dylanburkey/astro-blog-cms`.

## Setup

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Copy the admin pages to your project:
   ```bash
   cp -r node_modules/@dylanburkey/astro-blog-cms/src/pages/admin src/pages/
   cp -r node_modules/@dylanburkey/astro-blog-cms/src/layouts src/
   ```

3. Run migrations on your D1 database:
   ```bash
   wrangler d1 execute YOUR_DB --file=node_modules/@dylanburkey/astro-blog-cms/migrations/0001_blog_schema.sql
   ```

4. Configure your `wrangler.toml`:
   ```toml
   [[d1_databases]]
   binding = "DB"
   database_name = "your-db"
   database_id = "your-db-id"

   [[r2_buckets]]
   binding = "ASSETS_BUCKET"
   bucket_name = "your-bucket"
   ```

5. Start the dev server:
   ```bash
   pnpm dev
   ```

6. Visit `http://localhost:4321/admin` to access the CMS.
