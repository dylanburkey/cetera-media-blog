# CLAUDE.md - AI Assistant Context

> This document provides context and instructions for AI assistants working on
> the Astro Blog CMS project.

## Project Overview

**Astro Blog CMS** is a complete, open-source blog content management system
built for Astro + Cloudflare (D1/R2/Workers). It provides a rich WYSIWYG editor,
media management, and full admin interface.

### Tech Stack

- **Framework:** Astro 5.x with SSR
- **Runtime:** Cloudflare Workers
- **Database:** Cloudflare D1 (SQLite at edge)
- **Storage:** Cloudflare R2 (S3-compatible)
- **Styling:** Native CSS with custom properties
- **Build:** tsup for TypeScript compilation

## Architecture

```
src/
├── components/           # Reusable components
│   ├── editor/           # WYSIWYG editor components
│   └── blog/             # Public blog display components
├── layouts/              # Page layouts (AdminLayout)
├── lib/                  # Core utilities
│   ├── auth.ts           # Authentication (password hashing, sessions)
│   └── ...
├── pages/admin/          # Admin interface
│   ├── blog/             # Blog management pages
│   ├── media/            # Media library
│   └── api/              # API endpoints
├── styles/               # CSS styles
├── utils/                # Helper functions
├── config.ts             # CMS configuration
└── index.ts              # Main exports
```

## Code Standards

### TypeScript

```typescript
// Use proper types, avoid 'any' when possible
export interface BlogPost {
  id: number;
  slug: string;
  title: string;
  content: string;
  status: 'draft' | 'published' | 'archived';
}

// Export types for consumers
export type { BlogPost };
```

### Astro Components

```astro
---
// Props interface at top
export interface Props {
  title: string;
  basePath?: string;
}

const { title, basePath = '/admin' } = Astro.props;
---

<!-- Semantic HTML -->
<main class="admin-content">
  <h1>{title}</h1>
  <slot />
</main>

<style>
  /* Scoped styles with CSS custom properties */
  .admin-content {
    padding: var(--space-lg);
  }
</style>
```

### API Endpoints

```typescript
// Use proper Astro API route patterns
import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, cookies, locals }) => {
  try {
    const db = (locals as any).runtime?.env?.DB;
    // Handle request
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
```

## Development Workflow

### Commands

```bash
pnpm install          # Install dependencies
pnpm build            # Build package with tsup
pnpm lint             # Run ESLint
pnpm format           # Run Prettier
pnpm typecheck        # TypeScript check
pnpm changeset        # Create version changeset
```

### Branch Strategy

- `main` - Production releases
- `dev` - Development branch
- `feature/*` - New features
- `fix/*` - Bug fixes

### PR Workflow

1. Create branch from `dev`
2. Make changes
3. Run `pnpm lint && pnpm typecheck && pnpm build`
4. Create changeset: `pnpm changeset`
5. Open PR to `dev`
6. After review, merge to `dev`
7. Periodically merge `dev` → `main` for releases

## Key Areas for Development

### Priority 1: Core CMS Features
- [ ] Complete WYSIWYG editor polish
- [ ] Categories/Tags management pages
- [ ] User management (admin users)
- [ ] Settings page

### Priority 2: Public Blog Components
- [ ] Blog listing page template
- [ ] Single post page template
- [ ] Category/tag archive pages
- [ ] RSS feed generation

### Priority 3: Enhanced Features
- [ ] Draft preview
- [ ] Scheduled publishing
- [ ] Image optimization pipeline
- [ ] Search functionality
- [ ] Comment moderation UI

### Priority 4: Developer Experience
- [ ] Better TypeScript exports
- [ ] Component documentation
- [ ] Storybook for components
- [ ] E2E tests with Playwright

## Agents

Use these specialized focuses when working on different areas:

| Focus Area | Description |
|------------|-------------|
| `editor` | WYSIWYG editor components, formatting |
| `api` | REST API endpoints, database queries |
| `ui` | Admin interface, styling, layouts |
| `auth` | Authentication, sessions, security |
| `docs` | Documentation, examples, README |
| `test` | Testing, quality assurance |

## File Naming Conventions

- Components: `PascalCase.astro` (e.g., `EditorToolbar.astro`)
- API routes: `kebab-case.json.ts` (e.g., `upload-image.json.ts`)
- Utilities: `camelCase.ts` (e.g., `blog.ts`)
- Styles: `kebab-case.css` (e.g., `blog-content.css`)

## Database Schema

Key tables in D1:

- `admin_users` - Admin accounts
- `admin_sessions` - Auth sessions
- `blog_posts` - Blog content
- `blog_categories` - Post categories
- `blog_tags` - Post tags
- `blog_media` - Uploaded files
- `blog_comments` - User comments
- `blog_views` - Analytics

## Security Considerations

- Always hash passwords with PBKDF2 (see `lib/auth.ts`)
- Validate all user input
- Use parameterized queries (D1 prepare/bind)
- Session tokens are httpOnly cookies
- Sanitize HTML content in editor

## When Making Changes

1. **Check existing patterns** - Follow established code style
2. **Update types** - Keep TypeScript types in sync
3. **Test locally** - Verify with example project
4. **Update docs** - README, API docs if needed
5. **Create changeset** - For version bumping

---

_This CMS is designed to be vendor-neutral, configurable, and easy to integrate
into any Astro + Cloudflare project._
