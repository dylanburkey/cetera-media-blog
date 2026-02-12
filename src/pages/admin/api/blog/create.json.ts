import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const db = locals.runtime.env.DB;
    const formData = await request.formData();
    
    // Get form fields
    const title = formData.get('title') as string;
    if (!title) {
      throw new Error('Title is required');
    }
    
    // Generate slug from title if not provided
    const titleSlug = title.toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    
    const slug = formData.get('slug') as string || titleSlug;
    const excerpt = formData.get('excerpt') as string || '';
    const content = formData.get('content') as string || '';
    const cover_image = formData.get('cover_image') as string || null;
    const cover_image_alt = formData.get('cover_image_alt') as string || '';
    const status = formData.get('status') as string || 'draft';
    const featured = formData.get('featured') === 'on' ? 1 : 0;
    const meta_title = formData.get('meta_title') as string || title;
    const meta_description = formData.get('meta_description') as string || excerpt;
    const meta_keywords = formData.get('meta_keywords') as string || '';
    
    // Handle publish date
    let published_at = null;
    if (status === 'published') {
      const publishDateInput = formData.get('published_at') as string;
      published_at = publishDateInput ? new Date(publishDateInput).toISOString() : new Date().toISOString();
    }
    
    // TODO: Get actual user ID from session
    const author_id = 1;
    
    // Insert blog post
    const result = await db.prepare(`
      INSERT INTO blog_posts (
        slug, title, excerpt, content, cover_image, cover_image_alt,
        author_id, status, featured, meta_title, meta_description, meta_keywords,
        published_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      slug, title, excerpt, content, cover_image, cover_image_alt,
      author_id, status, featured, meta_title, meta_description, meta_keywords,
      published_at
    ).run();
    
    const postId = result.meta.last_row_id;
    
    // Handle categories
    const categories = formData.getAll('categories');
    for (const categoryId of categories) {
      await db.prepare(`
        INSERT INTO blog_post_categories (post_id, category_id)
        VALUES (?, ?)
      `).bind(postId, categoryId).run();
    }
    
    // Handle tags
    const tags = formData.getAll('tags[]');
    for (const tagId of tags) {
      await db.prepare(`
        INSERT INTO blog_post_tags (post_id, tag_id)
        VALUES (?, ?)
      `).bind(postId, tagId).run();
    }
    
    return new Response(JSON.stringify({ 
      success: true, 
      id: postId,
      slug: slug 
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error creating blog post:', error);
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