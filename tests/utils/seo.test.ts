import { describe, it, expect } from 'vitest';

// SEO utility functions
function generateMetaTitle(title: string, siteName?: string, maxLength = 60): string {
  if (!siteName) return title.substring(0, maxLength);
  
  const separator = ' | ';
  const fullTitle = `${title}${separator}${siteName}`;
  
  if (fullTitle.length <= maxLength) {
    return fullTitle;
  }
  
  // Truncate title to fit
  const availableLength = maxLength - separator.length - siteName.length;
  if (availableLength < 10) {
    return title.substring(0, maxLength);
  }
  
  return `${title.substring(0, availableLength)}${separator}${siteName}`;
}

function generateMetaDescription(content: string, maxLength = 160): string {
  // Strip HTML
  const text = content.replace(/<[^>]*>/g, '');
  
  // Clean up whitespace
  const cleaned = text.replace(/\s+/g, ' ').trim();
  
  if (cleaned.length <= maxLength) {
    return cleaned;
  }
  
  // Truncate at word boundary
  const truncated = cleaned.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > maxLength - 30) {
    return truncated.substring(0, lastSpace) + '...';
  }
  
  return truncated + '...';
}

function generateCanonicalUrl(baseUrl: string, slug: string): string {
  // Ensure base URL doesn't end with slash
  const base = baseUrl.replace(/\/+$/, '');
  // Ensure slug doesn't start with slash
  const path = slug.replace(/^\/+/, '');
  
  return `${base}/${path}`;
}

function generateOgImage(baseUrl: string, title: string, author?: string): string {
  const params = new URLSearchParams({ title });
  if (author) params.append('author', author);
  
  return `${baseUrl}/api/og?${params.toString()}`;
}

function generateKeywords(content: string, existingKeywords?: string): string[] {
  const existing = existingKeywords 
    ? existingKeywords.split(',').map(k => k.trim().toLowerCase())
    : [];
  
  // Extract potential keywords from content
  const text = content.replace(/<[^>]*>/g, '').toLowerCase();
  const words = text.split(/\W+/).filter(w => w.length > 4);
  
  // Count word frequency
  const frequency: Record<string, number> = {};
  words.forEach(word => {
    frequency[word] = (frequency[word] || 0) + 1;
  });
  
  // Get top keywords not already in existing
  const topKeywords = Object.entries(frequency)
    .filter(([word]) => !existing.includes(word))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word);
  
  return [...existing, ...topKeywords];
}

function validateSeoFields(data: {
  title?: string;
  description?: string;
  keywords?: string;
}): { valid: boolean; warnings: string[] } {
  const warnings: string[] = [];
  
  if (!data.title) {
    warnings.push('Missing meta title');
  } else if (data.title.length > 60) {
    warnings.push(`Meta title too long (${data.title.length}/60 characters)`);
  } else if (data.title.length < 30) {
    warnings.push('Meta title may be too short for optimal SEO');
  }
  
  if (!data.description) {
    warnings.push('Missing meta description');
  } else if (data.description.length > 160) {
    warnings.push(`Meta description too long (${data.description.length}/160 characters)`);
  } else if (data.description.length < 70) {
    warnings.push('Meta description may be too short');
  }
  
  if (!data.keywords) {
    warnings.push('No keywords specified');
  }
  
  return { valid: warnings.length === 0, warnings };
}

function generateBreadcrumbSchema(items: { name: string; url: string }[]): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  };
}

function generateSitemap(posts: { slug: string; updatedAt: string; priority?: number }[], baseUrl: string): string {
  const urls = posts.map(post => `
  <url>
    <loc>${baseUrl}/blog/${post.slug}</loc>
    <lastmod>${post.updatedAt}</lastmod>
    <priority>${post.priority || 0.7}</priority>
  </url>`).join('');
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}</loc>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/blog</loc>
    <priority>0.9</priority>
  </url>${urls}
</urlset>`;
}

describe('SEO Utilities', () => {
  describe('generateMetaTitle', () => {
    it('should return title alone if no site name', () => {
      expect(generateMetaTitle('My Blog Post')).toBe('My Blog Post');
    });

    it('should append site name', () => {
      expect(generateMetaTitle('My Post', 'My Site')).toBe('My Post | My Site');
    });

    it('should truncate long titles', () => {
      const longTitle = 'A'.repeat(80);
      const result = generateMetaTitle(longTitle, 'Site');
      expect(result.length).toBeLessThanOrEqual(60);
    });

    it('should prioritize title over site name when truncating', () => {
      const title = 'A'.repeat(50);
      const result = generateMetaTitle(title, 'Site Name');
      expect(result).toContain('Site Name');
    });
  });

  describe('generateMetaDescription', () => {
    it('should strip HTML tags', () => {
      const content = '<p>Hello <strong>world</strong></p>';
      expect(generateMetaDescription(content)).toBe('Hello world');
    });

    it('should truncate at word boundary', () => {
      const content = 'word '.repeat(100);
      const result = generateMetaDescription(content);
      expect(result.length).toBeLessThanOrEqual(163); // 160 + '...'
      expect(result.endsWith('...')).toBe(true);
    });

    it('should clean up whitespace', () => {
      const content = 'Hello    world\n\ntest';
      expect(generateMetaDescription(content)).toBe('Hello world test');
    });

    it('should not truncate short content', () => {
      const content = 'Short description';
      expect(generateMetaDescription(content)).toBe('Short description');
    });
  });

  describe('generateCanonicalUrl', () => {
    it('should combine base URL and slug', () => {
      expect(generateCanonicalUrl('https://example.com', 'my-post'))
        .toBe('https://example.com/my-post');
    });

    it('should handle trailing slashes in base URL', () => {
      expect(generateCanonicalUrl('https://example.com/', 'my-post'))
        .toBe('https://example.com/my-post');
    });

    it('should handle leading slashes in slug', () => {
      expect(generateCanonicalUrl('https://example.com', '/my-post'))
        .toBe('https://example.com/my-post');
    });
  });

  describe('generateOgImage', () => {
    it('should generate OG image URL with title', () => {
      const url = generateOgImage('https://example.com', 'My Post');
      expect(url).toContain('/api/og?');
      expect(url).toContain('title=My+Post');
    });

    it('should include author if provided', () => {
      const url = generateOgImage('https://example.com', 'My Post', 'John');
      expect(url).toContain('author=John');
    });
  });

  describe('generateKeywords', () => {
    it('should extract keywords from content', () => {
      const content = 'JavaScript development framework performance optimization';
      const keywords = generateKeywords(content);
      expect(keywords.length).toBeGreaterThan(0);
    });

    it('should preserve existing keywords', () => {
      const keywords = generateKeywords('some content', 'existing, keywords');
      expect(keywords).toContain('existing');
      expect(keywords).toContain('keywords');
    });

    it('should filter short words', () => {
      const content = 'the a an is are javascript development';
      const keywords = generateKeywords(content);
      expect(keywords).not.toContain('the');
      expect(keywords).not.toContain('is');
    });
  });

  describe('validateSeoFields', () => {
    it('should pass with valid fields', () => {
      const result = validateSeoFields({
        title: 'A Great Blog Post About Development',
        description: 'This is a comprehensive guide to modern web development practices and techniques that will help you build better applications.',
        keywords: 'web, development, javascript'
      });
      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it('should warn about missing title', () => {
      const result = validateSeoFields({ description: 'desc', keywords: 'key' });
      expect(result.warnings).toContain('Missing meta title');
    });

    it('should warn about long title', () => {
      const result = validateSeoFields({
        title: 'A'.repeat(70),
        description: 'Description',
        keywords: 'key'
      });
      expect(result.warnings.some(w => w.includes('too long'))).toBe(true);
    });

    it('should warn about missing description', () => {
      const result = validateSeoFields({ title: 'Title', keywords: 'key' });
      expect(result.warnings).toContain('Missing meta description');
    });

    it('should warn about missing keywords', () => {
      const result = validateSeoFields({ title: 'Title', description: 'Description' });
      expect(result.warnings).toContain('No keywords specified');
    });
  });

  describe('generateBreadcrumbSchema', () => {
    it('should generate valid breadcrumb schema', () => {
      const schema = generateBreadcrumbSchema([
        { name: 'Home', url: 'https://example.com' },
        { name: 'Blog', url: 'https://example.com/blog' },
        { name: 'Post', url: 'https://example.com/blog/post' }
      ]);

      expect(schema['@type']).toBe('BreadcrumbList');
      expect((schema as any).itemListElement).toHaveLength(3);
      expect((schema as any).itemListElement[0].position).toBe(1);
      expect((schema as any).itemListElement[2].position).toBe(3);
    });
  });

  describe('generateSitemap', () => {
    it('should generate valid XML sitemap', () => {
      const posts = [
        { slug: 'post-1', updatedAt: '2024-01-15', priority: 0.8 },
        { slug: 'post-2', updatedAt: '2024-01-10' }
      ];

      const sitemap = generateSitemap(posts, 'https://example.com');

      expect(sitemap).toContain('<?xml version="1.0"');
      expect(sitemap).toContain('<urlset');
      expect(sitemap).toContain('https://example.com/blog/post-1');
      expect(sitemap).toContain('<priority>0.8</priority>');
      expect(sitemap).toContain('<priority>0.7</priority>'); // default
    });

    it('should include homepage and blog index', () => {
      const sitemap = generateSitemap([], 'https://example.com');

      expect(sitemap).toContain('<loc>https://example.com</loc>');
      expect(sitemap).toContain('<loc>https://example.com/blog</loc>');
    });
  });
});
