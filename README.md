# Astro Blog CMS

A complete, production-ready blog CMS with a rich WYSIWYG editor, built for Astro + Cloudflare stack (D1 database, R2 storage, Workers runtime).

**Extracted from [Athena AI](https://athena.ai)** - battle-tested in production.

## Features

- ✅ **Rich WYSIWYG Editor** - Bold, italic, headings, lists, blockquotes, code blocks
- ✅ **Font Controls** - Family, size, text color, background color
- ✅ **Image Management** - Upload to R2, media library, drag & drop
- ✅ **Layout Templates** - Image galleries, split layouts, text columns
- ✅ **SEO Tools** - Meta title/description, keywords, Open Graph
- ✅ **Categories & Tags** - Hierarchical categories, flexible tagging
- ✅ **Publishing Workflow** - Draft/publish states, scheduled publishing
- ✅ **Analytics** - View tracking, engagement metrics
- ✅ **Comments** - Built-in comment system with moderation
- ✅ **Admin Authentication** - Secure session-based auth
- ✅ **Media Library** - Browse and manage uploaded images
- ✅ **Responsive** - Mobile-first admin interface

## Tech Stack

- **Framework**: Astro 5.x with SSR
- **Runtime**: Cloudflare Workers
- **Database**: Cloudflare D1 (SQLite at edge)
- **Storage**: Cloudflare R2 (S3-compatible)
- **Styling**: Native CSS with custom properties

## Quick Start

### 1. Install

```bash
npm install @dylanburkey/astro-blog-cms
# or
pnpm add @dylanburkey/astro-blog-cms
```

### 2. Copy Pages to Your Project

```bash
# Copy admin pages
cp -r node_modules/@dylanburkey/astro-blog-cms/src/pages/admin your-project/src/pages/

# Copy layout
cp node_modules/@dylanburkey/astro-blog-cms/src/layouts/AdminLayout.astro your-project/src/layouts/

# Copy styles
cp node_modules/@dylanburkey/astro-blog-cms/src/styles/blog-content.css your-project/src/styles/
```

### 3. Run Migrations

```bash
# Create the database tables
wrangler d1 execute YOUR_DB_NAME --file=node_modules/@dylanburkey/astro-blog-cms/migrations/0001_blog_schema.sql
wrangler d1 execute YOUR_DB_NAME --file=node_modules/@dylanburkey/astro-blog-cms/migrations/0002_blog_engagement.sql
```

### 4. Configure Cloudflare

Add to your `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "your-db-name"
database_id = "your-db-id"

[[r2_buckets]]
binding = "ASSETS_BUCKET"
bucket_name = "your-bucket-name"
```

### 5. Create Admin User

```bash
# Generate password hash (run in browser console or Node)
# Or use the provided utility:
wrangler d1 execute YOUR_DB_NAME --command="INSERT INTO admin_users (email, password_hash, name, role) VALUES ('admin@example.com', 'YOUR_HASH', 'Admin', 'admin')"
```

## File Structure

```
astro-blog-cms/
├── migrations/
│   ├── 0001_blog_schema.sql      # Core tables (posts, categories, tags, media)
│   └── 0002_blog_engagement.sql  # Analytics & engagement tables
├── src/
│   ├── components/
│   │   ├── editor/
│   │   │   ├── EditorToolbar.astro    # Main WYSIWYG toolbar
│   │   │   ├── ImageToolbar.astro     # Image editing controls
│   │   │   ├── LayoutTemplates.astro  # Gallery & layout options
│   │   │   └── TextLayouts.astro      # Text column layouts
│   │   └── blog/
│   │       ├── BlogCard.astro         # Post card for listings
│   │       ├── BlogSidebar.astro      # Sidebar with categories/tags
│   │       └── BlogComments.astro     # Comment display/form
│   ├── layouts/
│   │   └── AdminLayout.astro          # Admin panel layout
│   ├── lib/
│   │   ├── auth.ts                    # Authentication utilities
│   │   ├── authService.ts             # Session management
│   │   └── imageOptimization.ts       # Image processing
│   ├── pages/
│   │   └── admin/
│   │       ├── blog/
│   │       │   ├── index.astro        # Post list
│   │       │   ├── new.astro          # Create post (WYSIWYG editor)
│   │       │   └── edit/[id].astro    # Edit post
│   │       ├── media/
│   │       │   └── index.astro        # Media library
│   │       ├── api/
│   │       │   ├── blog/
│   │       │   │   ├── create.json.ts
│   │       │   │   ├── update.json.ts
│   │       │   │   ├── delete/[id].json.ts
│   │       │   │   └── duplicate/[id].json.ts
│   │       │   ├── upload-image.json.ts
│   │       │   ├── list-images.json.ts
│   │       │   └── delete-image.json.ts
│   │       └── login.astro
│   ├── styles/
│   │   └── blog-content.css           # Blog content styles
│   ├── utils/
│   │   └── blog.ts                    # Helper functions & types
│   └── index.ts                       # Main exports
├── LICENSE
├── CONTRIBUTING.md
└── README.md
```

## Admin Routes

| Route | Description |
|-------|-------------|
| `/admin/login` | Admin login page |
| `/admin/blog` | Blog post list with stats |
| `/admin/blog/new` | Create new post (WYSIWYG editor) |
| `/admin/blog/edit/[id]` | Edit existing post |
| `/admin/media` | Media library (browse R2 uploads) |

## API Endpoints

### Blog Posts

```typescript
// Create post
POST /admin/api/blog/create.json
Content-Type: multipart/form-data
Fields: title, slug, excerpt, content, cover_image, status, categories[], tags[]

// Update post
POST /admin/api/blog/update.json
Fields: id, title, slug, excerpt, content, cover_image, status, categories[], tags[]

// Delete post
DELETE /admin/api/blog/delete/[id].json

// Duplicate post
POST /admin/api/blog/duplicate/[id].json
```

### Images

```typescript
// Upload image to R2
POST /admin/api/upload-image.json
Content-Type: multipart/form-data

// List images from R2
GET /admin/api/list-images.json

// Delete image from R2
DELETE /admin/api/delete-image.json
Body: { key: "image-key.jpg" }
```

## Customization

### Styling

Override CSS custom properties in your global styles:

```css
:root {
  --color-primary: #6366f1;
  --color-surface: #1a1a1a;
  --color-background: #0a0a0a;
  --color-text: #ffffff;
  --color-text-muted: #999999;
  --color-border: #333333;
  --radius-md: 0.5rem;
}
```

### Admin Path

The admin uses `/admin` by default. To change it:

1. Move the `pages/admin` folder to your desired path
2. Update links in `AdminLayout.astro`

### Authentication

The CMS uses cookie-based sessions. Customize `src/lib/auth.ts` for:
- Different session duration
- Additional auth providers
- Role-based permissions

## Database Schema

### Core Tables

- `admin_users` - Admin accounts with roles
- `admin_sessions` - Session tokens
- `blog_posts` - Post content, metadata, SEO fields
- `blog_categories` - Hierarchical categories
- `blog_tags` - Flexible tagging
- `blog_post_categories` - Post-category relationships
- `blog_post_tags` - Post-tag relationships
- `blog_media` - Uploaded images/files
- `blog_views` - Analytics tracking
- `blog_comments` - User comments

## TypeScript Support

```typescript
import { 
  type BlogPost, 
  type BlogCategory, 
  type BlogTag,
  generateSlug,
  formatDate,
  calculateReadingTime,
  paths 
} from '@dylanburkey/astro-blog-cms';

// Use types
const post: BlogPost = { ... };

// Use utilities
const slug = generateSlug("My Blog Post Title");
const readTime = calculateReadingTime(post.content);

// Use path helpers
const editUrl = paths.admin.blog.edit(post.id);
```

## License

MIT License - Use freely in personal and commercial projects.

## Credits

Originally developed for [Athena AI](https://athena.ai) by Dylan Burkey.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.
