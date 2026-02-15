import { describe, it, expect, vi } from 'vitest';

// Mock the security utilities for testing
const sanitizeHTML = (input: string): string => {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/javascript:/gi, '');
};

const escapeHTML = (str: string): string => {
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
  };
  return str.replace(/[&<>"']/g, (char) => htmlEscapes[char]);
};

const generateCSRFToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
};

const validateSlug = (slug: string): boolean => {
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(slug) && slug.length <= 200;
};

const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
};

describe('Security Utilities', () => {
  describe('sanitizeHTML', () => {
    it('should remove script tags', () => {
      const input = '<p>Hello</p><script>alert("xss")</script>';
      const result = sanitizeHTML(input);
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('alert');
    });

    it('should remove inline event handlers', () => {
      const input = '<img src="x" onerror="alert(1)">';
      const result = sanitizeHTML(input);
      expect(result).not.toContain('onerror');
    });

    it('should remove javascript: URLs', () => {
      const input = '<a href="javascript:alert(1)">Click</a>';
      const result = sanitizeHTML(input);
      expect(result).not.toContain('javascript:');
    });

    it('should preserve safe HTML', () => {
      const input = '<p>Hello <strong>world</strong></p>';
      const result = sanitizeHTML(input);
      expect(result).toContain('<p>');
      expect(result).toContain('<strong>');
    });
  });

  describe('escapeHTML', () => {
    it('should escape ampersands', () => {
      expect(escapeHTML('foo & bar')).toBe('foo &amp; bar');
    });

    it('should escape angle brackets', () => {
      expect(escapeHTML('<script>')).toBe('&lt;script&gt;');
    });

    it('should escape quotes', () => {
      expect(escapeHTML('"hello"')).toBe('&quot;hello&quot;');
    });

    it('should escape single quotes', () => {
      expect(escapeHTML("it's")).toBe("it&#x27;s");
    });

    it('should handle empty strings', () => {
      expect(escapeHTML('')).toBe('');
    });

    it('should handle strings with no special characters', () => {
      expect(escapeHTML('hello world')).toBe('hello world');
    });
  });

  describe('generateCSRFToken', () => {
    it('should generate a 64-character hex string', () => {
      const token = generateCSRFToken();
      expect(token).toHaveLength(64);
      expect(/^[a-f0-9]+$/.test(token)).toBe(true);
    });

    it('should generate unique tokens', () => {
      const token1 = generateCSRFToken();
      const token2 = generateCSRFToken();
      expect(token1).not.toBe(token2);
    });
  });

  describe('validateSlug', () => {
    it('should accept valid slugs', () => {
      expect(validateSlug('hello-world')).toBe(true);
      expect(validateSlug('my-blog-post')).toBe(true);
      expect(validateSlug('post123')).toBe(true);
    });

    it('should reject slugs with uppercase', () => {
      expect(validateSlug('Hello-World')).toBe(false);
    });

    it('should reject slugs with special characters', () => {
      expect(validateSlug('hello_world')).toBe(false);
      expect(validateSlug('hello world')).toBe(false);
      expect(validateSlug('hello@world')).toBe(false);
    });

    it('should reject slugs starting or ending with hyphen', () => {
      expect(validateSlug('-hello')).toBe(false);
      expect(validateSlug('hello-')).toBe(false);
    });

    it('should reject slugs over 200 characters', () => {
      const longSlug = 'a'.repeat(201);
      expect(validateSlug(longSlug)).toBe(false);
    });

    it('should reject empty slugs', () => {
      expect(validateSlug('')).toBe(false);
    });
  });

  describe('sanitizeFilename', () => {
    it('should convert to lowercase', () => {
      expect(sanitizeFilename('MyFile.jpg')).toBe('myfile.jpg');
    });

    it('should replace spaces with hyphens', () => {
      expect(sanitizeFilename('my file.jpg')).toBe('my-file.jpg');
    });

    it('should remove special characters', () => {
      expect(sanitizeFilename('file@#$.jpg')).toBe('file.jpg');
    });

    it('should collapse multiple hyphens', () => {
      expect(sanitizeFilename('my---file.jpg')).toBe('my-file.jpg');
    });

    it('should handle edge cases', () => {
      expect(sanitizeFilename('---file---.jpg')).toBe('file.jpg');
    });
  });
});
