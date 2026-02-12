import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const db = (locals as any).runtime?.env?.DB;
    
    if (!db) {
      return new Response(JSON.stringify({ success: false, error: 'Database not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const formData = await request.formData();
    const name = formData.get('name')?.toString()?.trim();
    let slug = formData.get('slug')?.toString()?.trim();
    const description = formData.get('description')?.toString()?.trim() || null;

    if (!name) {
      return new Response(JSON.stringify({ success: false, error: 'Name is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Generate slug if not provided
    if (!slug) {
      slug = name
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
    }

    // Check for duplicate slug
    const existing = await db.prepare(
      'SELECT id FROM blog_tags WHERE slug = ?'
    ).bind(slug).first();

    if (existing) {
      return new Response(JSON.stringify({ success: false, error: 'A tag with this slug already exists' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Insert tag
    const result = await db.prepare(`
      INSERT INTO blog_tags (name, slug, description)
      VALUES (?, ?, ?)
    `).bind(name, slug, description).run();

    return new Response(JSON.stringify({ 
      success: true, 
      tag: { id: result.meta.last_row_id, name, slug }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Create tag error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Failed to create tag' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
