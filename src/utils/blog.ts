/**
 * Blog Utility Functions
 * 
 * Helper functions for blog operations
 */

/**
 * Generate a URL-friendly slug from a title
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

/**
 * Truncate text to a maximum length
 */
export function truncate(text: string, maxLength: number = 160): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

/**
 * Format a date for display
 */
export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', options || {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Calculate reading time from content
 */
export function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const text = content.replace(/<[^>]*>/g, ''); // Strip HTML
  const wordCount = text.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

/**
 * Extract headings for table of contents
 */
export function extractHeadings(content: string): Array<{ id: string; text: string; level: number }> {
  const headings: Array<{ id: string; text: string; level: number }> = [];
  const regex = /<h([2-4])[^>]*id="([^"]*)"[^>]*>([^<]*)<\/h[2-4]>/gi;
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    headings.push({
      level: parseInt(match[1]),
      id: match[2],
      text: match[3].trim()
    });
  }
  
  return headings;
}

/**
 * Add IDs to headings for anchor links
 */
export function addHeadingIds(content: string): string {
  let counter = 0;
  return content.replace(/<h([2-4])([^>]*)>([^<]*)<\/h[2-4]>/gi, (match, level, attrs, text) => {
    if (attrs.includes('id=')) return match;
    const id = text.toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim() || `heading-${++counter}`;
    return `<h${level}${attrs} id="${id}">${text}</h${level}>`;
  });
}

/**
 * Strip HTML tags from content
 */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

/**
 * Get excerpt from content if not provided
 */
export function getExcerpt(content: string, maxLength: number = 160): string {
  const text = stripHtml(content);
  return truncate(text, maxLength);
}

// Types
export interface BlogPost {
  id: number;
  slug: string;
  title: string;
  excerpt?: string;
  content: string;
  cover_image?: string;
  cover_image_alt?: string;
  author_id: number;
  status: 'draft' | 'published' | 'archived';
  featured: boolean;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  published_at?: string;
  created_at: string;
  updated_at: string;
}

export interface BlogCategory {
  id: number;
  slug: string;
  name: string;
  description?: string;
  parent_id?: number;
  sort_order: number;
}

export interface BlogTag {
  id: number;
  slug: string;
  name: string;
  description?: string;
}

export interface BlogAuthor {
  id: number;
  email: string;
  name?: string;
  avatar?: string;
  bio?: string;
  twitter_url?: string;
  github_url?: string;
  linkedin_url?: string;
  website_url?: string;
}
