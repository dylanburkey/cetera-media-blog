-- =====================================================
-- CMS Settings Table
-- Key-value store for site configuration
-- =====================================================

CREATE TABLE IF NOT EXISTS cms_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert default settings
INSERT OR IGNORE INTO cms_settings (key, value) VALUES
  ('site_name', 'My Blog'),
  ('site_description', ''),
  ('site_url', ''),
  ('admin_email', ''),
  ('posts_per_page', '10'),
  ('default_post_status', 'draft'),
  ('comments_enabled', 'true'),
  ('comments_moderation', 'true'),
  ('max_upload_size', '5'),
  ('allowed_file_types', 'jpg,jpeg,png,gif,webp,svg'),
  ('meta_title_suffix', ''),
  ('default_og_image', ''),
  ('google_analytics_id', '');
