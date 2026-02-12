import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ params, locals }) => {
  try {
    const db = locals.runtime.env.DB;
    const { id } = params;
    
    // Get the original post
    const original = await db.prepare('SELECT * FROM blog_posts WHERE id = ?').bind(id).first();
    
    if (!original) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Post not found' 
      }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    // Create a new slug with timestamp
    const timestamp = Date.now();
    const newSlug = `${original.slug}-copy-${timestamp}`;
    const newTitle = `${original.title} (Copy)`;
    
    // Insert the duplicate
    const result = await db.prepare(`
      INSERT INTO blog_posts (
        slug, title, excerpt, content, cover_image, cover_image_alt,
        author_id, status, featured, meta_title, meta_description, meta_keywords,
        og_title, og_description, og_image, created_at, updated_at
      ) 
      SELECT 
        ?, ?, excerpt, content, cover_image, cover_image_alt,
        author_id, 'draft', 0, ?, meta_description, meta_keywords,
        og_title, og_description, og_image, datetime('now'), datetime('now')
      FROM blog_posts WHERE id = ?
    `).bind(newSlug, newTitle, newTitle, id).run();
    
    const newPostId = result.meta.last_row_id;
    
    // Copy categories
    await db.prepare(`
      INSERT INTO blog_post_categories (post_id, category_id)
      SELECT ?, category_id FROM blog_post_categories WHERE post_id = ?
    `).bind(newPostId, id).run();
    
    // Copy tags
    await db.prepare(`
      INSERT INTO blog_post_tags (post_id, tag_id)
      SELECT ?, tag_id FROM blog_post_tags WHERE post_id = ?
    `).bind(newPostId, id).run();
    
    return new Response(JSON.stringify({ 
      success: true,
      id: newPostId,
      message: 'Post duplicated successfully'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error duplicating blog post:', error);
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