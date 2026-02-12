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

    // Remove tag associations from posts (posts are not deleted)
    await db.prepare(
      'DELETE FROM blog_post_tags WHERE tag_id = ?'
    ).bind(parseInt(id, 10)).run();

    // Delete the tag
    await db.prepare(
      'DELETE FROM blog_tags WHERE id = ?'
    ).bind(parseInt(id, 10)).run();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Delete tag error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Failed to delete tag' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
