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

    // Check for duplicate slug (excluding current tag)
    const existing = await db.prepare(
      'SELECT id FROM blog_tags WHERE slug = ? AND id != ?'
    ).bind(slug, parseInt(id, 10)).first();

    if (existing) {
      return new Response(JSON.stringify({ success: false, error: 'A tag with this slug already exists' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Update tag
    await db.prepare(`
      UPDATE blog_tags 
      SET name = ?, slug = ?, description = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(name, slug, description, parseInt(id, 10)).run();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Update tag error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Failed to update tag' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
