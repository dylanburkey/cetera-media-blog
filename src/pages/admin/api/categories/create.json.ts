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
    const parent_id = formData.get('parent_id')?.toString() || null;
    const sort_order = parseInt(formData.get('sort_order')?.toString() || '0', 10);

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
      'SELECT id FROM blog_categories WHERE slug = ?'
    ).bind(slug).first();

    if (existing) {
      return new Response(JSON.stringify({ success: false, error: 'A category with this slug already exists' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Insert category
    const result = await db.prepare(`
      INSERT INTO blog_categories (name, slug, description, parent_id, sort_order)
      VALUES (?, ?, ?, ?, ?)
    `).bind(name, slug, description, parent_id ? parseInt(parent_id, 10) : null, sort_order).run();

    return new Response(JSON.stringify({ 
      success: true, 
      category: { id: result.meta.last_row_id, name, slug }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Create category error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Failed to create category' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
