/**
 * CMS Configuration
 * 
 * Override these values in your project by creating a cms.config.ts file
 * or by passing props directly to components.
 */

export interface CMSConfig {
  /** Site/brand name shown in admin */
  siteName: string;
  /** Path to logo image (relative to public/) */
  logoPath?: string;
  /** Base path for admin routes (default: /admin) */
  adminBasePath: string;
  /** Session cookie name */
  sessionCookieName: string;
  /** Session storage key prefix */
  storageKeyPrefix: string;
}

export const defaultConfig: CMSConfig = {
  siteName: 'CMS',
  logoPath: undefined, // No logo by default, shows text only
  adminBasePath: '/admin',
  sessionCookieName: 'cms_admin_session',
  storageKeyPrefix: 'cms',
};

// Allow runtime config override
let currentConfig: CMSConfig = { ...defaultConfig };

export function configureCMS(config: Partial<CMSConfig>): void {
  currentConfig = { ...defaultConfig, ...config };
}

export function getConfig(): CMSConfig {
  return currentConfig;
}

// Navigation items for admin sidebar
export function getNavItems(basePath: string = '/admin') {
  return [
    { href: basePath, label: 'Dashboard', icon: 'dashboard' },
    { href: `${basePath}/blog`, label: 'Blog', icon: 'blog' },
    { href: `${basePath}/media`, label: 'Media', icon: 'media' },
    { href: `${basePath}/settings`, label: 'Settings', icon: 'settings' },
  ];
}
