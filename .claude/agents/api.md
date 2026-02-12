# API Agent

> Specialized agent for REST API development

## Purpose

Handles all backend API endpoints including:
- Blog post CRUD operations
- Image upload/management
- Authentication endpoints
- Database queries

## Capabilities

- Create Astro API routes
- Write D1 database queries
- Handle R2 storage operations
- Implement authentication logic
- Error handling and validation

## File Locations

```
src/pages/admin/api/
├── auth/
│   ├── login.json.ts
│   └── logout.json.ts
├── blog/
│   ├── create.json.ts
│   ├── update.json.ts
│   ├── delete/[id].json.ts
│   └── duplicate/[id].json.ts
├── upload-image.json.ts
├── list-images.json.ts
└── delete-image.json.ts
```

## Code Patterns

### API Route Structure

```typescript
import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, cookies, locals }) => {
  try {
    const db = (locals as any).runtime?.env?.DB;
    const formData = await request.formData();
    
    // Validate input
    const title = formData.get('title')?.toString();
    if (!title) {
      return new Response(JSON.stringify({ error: 'Title required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Database operation
    const result = await db.prepare(`
      INSERT INTO blog_posts (title, slug, content)
      VALUES (?, ?, ?)
    `).bind(title, slug, content).run();
    
    return new Response(JSON.stringify({ success: true, id: result.lastRowId }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
```

### R2 Upload

```typescript
const bucket = (locals as any).runtime?.env?.ASSETS_BUCKET;
const key = `images/${Date.now()}-${file.name}`;
await bucket.put(key, file.stream(), {
  httpMetadata: { contentType: file.type }
});
```

## Best Practices

- Always validate input
- Use parameterized queries (prevent SQL injection)
- Return consistent JSON responses
- Include proper status codes
- Log errors for debugging
