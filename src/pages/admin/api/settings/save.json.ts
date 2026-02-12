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
    
    // List of all setting keys we expect
    const settingKeys = [
      'site_name',
      'site_description',
      'site_url',
      'admin_email',
      'posts_per_page',
      'default_post_status',
      'comments_enabled',
      'comments_moderation',
      'max_upload_size',
      'allowed_file_types',
      'meta_title_suffix',
      'default_og_image',
      'google_analytics_id',
    ];

    // Ensure settings table exists
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS cms_settings (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    // Upsert each setting
    const stmt = db.prepare(`
      INSERT INTO cms_settings (key, value, updated_at) 
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
    `);

    for (const key of settingKeys) {
      const value = formData.get(key)?.toString() || '';
      await stmt.bind(key, value).run();
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Save settings error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Failed to save settings' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
