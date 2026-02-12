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
    const id = formData.get('id')?.toString();
    const name = formData.get('name')?.toString()?.trim();
    let slug = formData.get('slug')?.toString()?.trim();
    const description = formData.get('description')?.toString()?.trim() || null;
    const parent_id = formData.get('parent_id')?.toString() || null;
    const sort_order = parseInt(formData.get('sort_order')?.toString() || '0', 10);

    if (!id || !name) {
      return new Response(JSON.stringify({ success: false, error: 'ID and Name are required' }), {
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

    // Check for duplicate slug (excluding current category)
    const existing = await db.prepare(
      'SELECT id FROM blog_categories WHERE slug = ? AND id != ?'
    ).bind(slug, parseInt(id, 10)).first();

    if (existing) {
      return new Response(JSON.stringify({ success: false, error: 'A category with this slug already exists' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Prevent setting self as parent
    if (parent_id && parseInt(parent_id, 10) === parseInt(id, 10)) {
      return new Response(JSON.stringify({ success: false, error: 'Category cannot be its own parent' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Update category
    await db.prepare(`
      UPDATE blog_categories 
      SET name = ?, slug = ?, description = ?, parent_id = ?, sort_order = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(name, slug, description, parent_id ? parseInt(parent_id, 10) : null, sort_order, parseInt(id, 10)).run();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Update category error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Failed to update category' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
