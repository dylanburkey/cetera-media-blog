import type { APIRoute } from 'astro';

export const DELETE: APIRoute = async ({ request, locals }) => {
  try {
    const db = (locals as any).runtime?.env?.DB;
    
    if (!db) {
      return new Response(JSON.stringify({ success: false, error: 'Database not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { id } = await request.json();

    if (!id) {
      return new Response(JSON.stringify({ success: false, error: 'ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Remove category associations from posts (posts are not deleted)
    await db.prepare(
      'DELETE FROM blog_post_categories WHERE category_id = ?'
    ).bind(parseInt(id, 10)).run();

    // Update child categories to have no parent
    await db.prepare(
      'UPDATE blog_categories SET parent_id = NULL WHERE parent_id = ?'
    ).bind(parseInt(id, 10)).run();

    // Delete the category
    await db.prepare(
      'DELETE FROM blog_categories WHERE id = ?'
    ).bind(parseInt(id, 10)).run();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Delete category error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Failed to delete category' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
