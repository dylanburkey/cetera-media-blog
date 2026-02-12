/**
 * CMS Settings Utilities
 * 
 * Functions for accessing CMS settings from the database
 */

export interface CMSSettings {
  site_name: string;
  site_description: string;
  site_url: string;
  admin_email: string;
  posts_per_page: number;
  default_post_status: 'draft' | 'published';
  comments_enabled: boolean;
  comments_moderation: boolean;
  max_upload_size: number;
  allowed_file_types: string[];
  meta_title_suffix: string;
  default_og_image: string;
  google_analytics_id: string;
}

const defaultSettings: CMSSettings = {
  site_name: 'My Blog',
  site_description: '',
  site_url: '',
  admin_email: '',
  posts_per_page: 10,
  default_post_status: 'draft',
  comments_enabled: true,
  comments_moderation: true,
  max_upload_size: 5,
  allowed_file_types: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
  meta_title_suffix: '',
  default_og_image: '',
  google_analytics_id: '',
};

/**
 * Get all CMS settings from the database
 */
export async function getSettings(db: any): Promise<CMSSettings> {
  if (!db) {
    return defaultSettings;
  }

  try {
    const result = await db.prepare('SELECT key, value FROM cms_settings').all();
    const rawSettings: Record<string, string> = {};
    
    for (const row of (result.results || [])) {
      rawSettings[row.key] = row.value;
    }

    return parseSettings(rawSettings);
  } catch {
    // Table might not exist yet
    return defaultSettings;
  }
}

/**
 * Get a single setting value
 */
export async function getSetting<K extends keyof CMSSettings>(
  db: any, 
  key: K
): Promise<CMSSettings[K]> {
  const settings = await getSettings(db);
  return settings[key];
}

/**
 * Parse raw string settings into typed CMSSettings
 */
function parseSettings(raw: Record<string, string>): CMSSettings {
  return {
    site_name: raw.site_name || defaultSettings.site_name,
    site_description: raw.site_description || defaultSettings.site_description,
    site_url: raw.site_url || defaultSettings.site_url,
    admin_email: raw.admin_email || defaultSettings.admin_email,
    posts_per_page: parseInt(raw.posts_per_page || '10', 10),
    default_post_status: (raw.default_post_status as 'draft' | 'published') || 'draft',
    comments_enabled: raw.comments_enabled !== 'false',
    comments_moderation: raw.comments_moderation !== 'false',
    max_upload_size: parseInt(raw.max_upload_size || '5', 10),
    allowed_file_types: (raw.allowed_file_types || 'jpg,jpeg,png,gif,webp,svg').split(',').map(s => s.trim()),
    meta_title_suffix: raw.meta_title_suffix || '',
    default_og_image: raw.default_og_image || '',
    google_analytics_id: raw.google_analytics_id || '',
  };
}

/**
 * Check if a file type is allowed for upload
 */
export function isAllowedFileType(filename: string, allowedTypes: string[]): boolean {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  return allowedTypes.includes(ext);
}

/**
 * Check if file size is within limit
 */
export function isWithinSizeLimit(sizeBytes: number, maxSizeMB: number): boolean {
  return sizeBytes <= maxSizeMB * 1024 * 1024;
}
