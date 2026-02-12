import type { APIRoute } from 'astro';

export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    const db = locals.runtime.env.DB;
    const { id } = params;
    
    // Delete related records first (due to foreign key constraints)
    await db.prepare('DELETE FROM blog_post_categories WHERE post_id = ?').bind(id).run();
    await db.prepare('DELETE FROM blog_post_tags WHERE post_id = ?').bind(id).run();
    await db.prepare('DELETE FROM blog_views WHERE post_id = ?').bind(id).run();
    
    // Delete the blog post
    await db.prepare('DELETE FROM blog_posts WHERE id = ?').bind(id).run();
    
    return new Response(JSON.stringify({ 
      success: true,
      message: 'Post deleted successfully'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error deleting blog post:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};