import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ locals }) => {
  try {
    const db = (locals as any).runtime?.env?.DB;
    
    if (!db) {
      return new Response(JSON.stringify({ success: false, error: 'Database not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Default values
    const defaults: Record<string, string> = {
      site_name: 'My Blog',
      site_description: '',
      site_url: '',
      posts_per_page: '10',
      default_post_status: 'draft',
      comments_enabled: 'true',
      comments_moderation: 'true',
      max_upload_size: '5',
      allowed_file_types: 'jpg,jpeg,png,gif,webp,svg',
      meta_title_suffix: '',
      default_og_image: '',
      google_analytics_id: '',
      admin_email: '',
    };

    try {
      const result = await db.prepare('SELECT key, value FROM cms_settings').all();
      
      const settings = { ...defaults };
      for (const row of (result.results || [])) {
        settings[row.key] = row.value;
      }

      return new Response(JSON.stringify({ success: true, settings }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch {
      // Table might not exist yet
      return new Response(JSON.stringify({ success: true, settings: defaults }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('Get settings error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Failed to get settings' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
