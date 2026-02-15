import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock types
interface BlogPost {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  cover_image?: string;
  status: 'draft' | 'published' | 'archived';
  author_id: number;
  category_id?: number;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  featured: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
  published_at?: string;
}

interface CreatePostInput {
  title: string;
  content: string;
  slug?: string;
  excerpt?: string;
  cover_image?: string;
  status?: 'draft' | 'published';
  category_id?: number;
  tags?: number[];
  meta_title?: string;
  meta_description?: string;
  featured?: boolean;
}

interface UpdatePostInput extends Partial<CreatePostInput> {
  id: number;
}

// Mock blog service
class BlogService {
  private posts: Map<number, BlogPost> = new Map();
  private nextId = 1;

  generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 200);
  }

  generateExcerpt(content: string, maxLength = 160): string {
    const text = content.replace(/<[^>]*>/g, '');
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).replace(/\s+\S*$/, '') + '...';
  }

  async create(input: CreatePostInput, authorId: number): Promise<BlogPost> {
    const now = new Date().toISOString();
    const slug = input.slug || this.generateSlug(input.title);
    
    // Check for duplicate slug
    for (const post of this.posts.values()) {
      if (post.slug === slug) {
        throw new Error('Slug already exists');
      }
    }

    const post: BlogPost = {
      id: this.nextId++,
      title: input.title,
      slug,
      content: input.content,
      excerpt: input.excerpt || this.generateExcerpt(input.content),
      cover_image: input.cover_image,
      status: input.status || 'draft',
      author_id: authorId,
      category_id: input.category_id,
      meta_title: input.meta_title || input.title,
      meta_description: input.meta_description || this.generateExcerpt(input.content),
      meta_keywords: '',
      featured: input.featured || false,
      view_count: 0,
      created_at: now,
      updated_at: now,
      published_at: input.status === 'published' ? now : undefined
    };

    this.posts.set(post.id, post);
    return post;
  }

  async update(input: UpdatePostInput): Promise<BlogPost> {
    const post = this.posts.get(input.id);
    if (!post) throw new Error('Post not found');

    // Check slug uniqueness if changing
    if (input.slug && input.slug !== post.slug) {
      for (const p of this.posts.values()) {
        if (p.slug === input.slug && p.id !== input.id) {
          throw new Error('Slug already exists');
        }
      }
    }

    const updated: BlogPost = {
      ...post,
      ...input,
      updated_at: new Date().toISOString(),
      published_at: input.status === 'published' && !post.published_at 
        ? new Date().toISOString() 
        : post.published_at
    };

    this.posts.set(input.id, updated);
    return updated;
  }

  async delete(id: number): Promise<boolean> {
    return this.posts.delete(id);
  }

  async getById(id: number): Promise<BlogPost | undefined> {
    return this.posts.get(id);
  }

  async getBySlug(slug: string): Promise<BlogPost | undefined> {
    for (const post of this.posts.values()) {
      if (post.slug === slug) return post;
    }
    return undefined;
  }

  async list(options: {
    status?: 'draft' | 'published' | 'archived';
    category_id?: number;
    featured?: boolean;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ posts: BlogPost[]; total: number }> {
    let posts = Array.from(this.posts.values());

    if (options.status) {
      posts = posts.filter(p => p.status === options.status);
    }
    if (options.category_id) {
      posts = posts.filter(p => p.category_id === options.category_id);
    }
    if (options.featured !== undefined) {
      posts = posts.filter(p => p.featured === options.featured);
    }

    posts.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    const total = posts.length;
    const offset = options.offset || 0;
    const limit = options.limit || 10;
    posts = posts.slice(offset, offset + limit);

    return { posts, total };
  }

  async incrementViewCount(id: number): Promise<void> {
    const post = this.posts.get(id);
    if (post) {
      post.view_count++;
    }
  }

  async duplicate(id: number, authorId: number): Promise<BlogPost> {
    const original = this.posts.get(id);
    if (!original) throw new Error('Post not found');

    let newSlug = `${original.slug}-copy`;
    let counter = 1;
    while (this.getBySlugSync(newSlug)) {
      newSlug = `${original.slug}-copy-${counter++}`;
    }

    return this.create({
      title: `${original.title} (Copy)`,
      slug: newSlug,
      content: original.content,
      excerpt: original.excerpt,
      cover_image: original.cover_image,
      status: 'draft',
      category_id: original.category_id,
      meta_title: original.meta_title,
      meta_description: original.meta_description
    }, authorId);
  }

  private getBySlugSync(slug: string): BlogPost | undefined {
    for (const post of this.posts.values()) {
      if (post.slug === slug) return post;
    }
    return undefined;
  }

  clear(): void {
    this.posts.clear();
    this.nextId = 1;
  }
}

describe('BlogService', () => {
  let service: BlogService;

  beforeEach(() => {
    service = new BlogService();
  });

  describe('generateSlug', () => {
    it('should convert title to lowercase slug', () => {
      expect(service.generateSlug('Hello World')).toBe('hello-world');
    });

    it('should remove special characters', () => {
      expect(service.generateSlug('Hello! World?')).toBe('hello-world');
    });

    it('should handle multiple spaces', () => {
      expect(service.generateSlug('Hello   World')).toBe('hello-world');
    });

    it('should trim leading/trailing hyphens', () => {
      expect(service.generateSlug('---Hello World---')).toBe('hello-world');
    });

    it('should truncate to 200 characters', () => {
      const longTitle = 'word '.repeat(100);
      const slug = service.generateSlug(longTitle);
      expect(slug.length).toBeLessThanOrEqual(200);
    });
  });

  describe('generateExcerpt', () => {
    it('should strip HTML tags', () => {
      const content = '<p>Hello <strong>world</strong></p>';
      expect(service.generateExcerpt(content)).toBe('Hello world');
    });

    it('should truncate long content', () => {
      const content = 'word '.repeat(100);
      const excerpt = service.generateExcerpt(content);
      expect(excerpt.length).toBeLessThanOrEqual(163); // 160 + '...'
      expect(excerpt.endsWith('...')).toBe(true);
    });

    it('should not truncate short content', () => {
      const content = 'Short text';
      expect(service.generateExcerpt(content)).toBe('Short text');
    });
  });

  describe('create', () => {
    it('should create a new post', async () => {
      const post = await service.create({
        title: 'Test Post',
        content: '<p>Test content</p>'
      }, 1);

      expect(post.id).toBe(1);
      expect(post.title).toBe('Test Post');
      expect(post.slug).toBe('test-post');
      expect(post.status).toBe('draft');
    });

    it('should auto-generate slug from title', async () => {
      const post = await service.create({
        title: 'My Amazing Blog Post!',
        content: 'Content'
      }, 1);

      expect(post.slug).toBe('my-amazing-blog-post');
    });

    it('should use custom slug if provided', async () => {
      const post = await service.create({
        title: 'Test Post',
        content: 'Content',
        slug: 'custom-slug'
      }, 1);

      expect(post.slug).toBe('custom-slug');
    });

    it('should throw error for duplicate slug', async () => {
      await service.create({ title: 'Test', content: 'Content', slug: 'unique' }, 1);
      
      await expect(
        service.create({ title: 'Test 2', content: 'Content', slug: 'unique' }, 1)
      ).rejects.toThrow('Slug already exists');
    });

    it('should auto-generate excerpt from content', async () => {
      const post = await service.create({
        title: 'Test',
        content: '<p>This is the content of my blog post.</p>'
      }, 1);

      expect(post.excerpt).toBe('This is the content of my blog post.');
    });

    it('should set published_at when status is published', async () => {
      const post = await service.create({
        title: 'Test',
        content: 'Content',
        status: 'published'
      }, 1);

      expect(post.published_at).toBeDefined();
    });
  });

  describe('update', () => {
    beforeEach(async () => {
      await service.create({ title: 'Original', content: 'Original content' }, 1);
    });

    it('should update post fields', async () => {
      const updated = await service.update({
        id: 1,
        title: 'Updated Title'
      });

      expect(updated.title).toBe('Updated Title');
      expect(updated.content).toBe('Original content'); // unchanged
    });

    it('should update updated_at timestamp', async () => {
      const original = await service.getById(1);
      await new Promise(r => setTimeout(r, 10));
      
      const updated = await service.update({ id: 1, title: 'New' });
      expect(updated.updated_at).not.toBe(original?.updated_at);
    });

    it('should throw error for non-existent post', async () => {
      await expect(
        service.update({ id: 999, title: 'New' })
      ).rejects.toThrow('Post not found');
    });
  });

  describe('delete', () => {
    it('should delete existing post', async () => {
      await service.create({ title: 'Test', content: 'Content' }, 1);
      
      const result = await service.delete(1);
      expect(result).toBe(true);
      expect(await service.getById(1)).toBeUndefined();
    });

    it('should return false for non-existent post', async () => {
      const result = await service.delete(999);
      expect(result).toBe(false);
    });
  });

  describe('list', () => {
    beforeEach(async () => {
      await service.create({ title: 'Post 1', content: 'C', status: 'published' }, 1);
      await service.create({ title: 'Post 2', content: 'C', status: 'draft' }, 1);
      await service.create({ title: 'Post 3', content: 'C', status: 'published', featured: true }, 1);
    });

    it('should list all posts', async () => {
      const { posts, total } = await service.list();
      expect(posts).toHaveLength(3);
      expect(total).toBe(3);
    });

    it('should filter by status', async () => {
      const { posts } = await service.list({ status: 'published' });
      expect(posts).toHaveLength(2);
    });

    it('should filter by featured', async () => {
      const { posts } = await service.list({ featured: true });
      expect(posts).toHaveLength(1);
    });

    it('should support pagination', async () => {
      const { posts } = await service.list({ limit: 2, offset: 0 });
      expect(posts).toHaveLength(2);
    });
  });

  describe('duplicate', () => {
    it('should create a copy with modified title and slug', async () => {
      await service.create({ title: 'Original', content: 'Content', slug: 'original' }, 1);
      
      const copy = await service.duplicate(1, 2);
      
      expect(copy.title).toBe('Original (Copy)');
      expect(copy.slug).toBe('original-copy');
      expect(copy.status).toBe('draft');
      expect(copy.author_id).toBe(2);
    });

    it('should handle multiple copies', async () => {
      await service.create({ title: 'Original', content: 'Content', slug: 'original' }, 1);
      
      const copy1 = await service.duplicate(1, 1);
      const copy2 = await service.duplicate(1, 1);
      
      expect(copy1.slug).toBe('original-copy');
      expect(copy2.slug).toBe('original-copy-1');
    });
  });

  describe('incrementViewCount', () => {
    it('should increment view count', async () => {
      await service.create({ title: 'Test', content: 'Content' }, 1);
      
      await service.incrementViewCount(1);
      await service.incrementViewCount(1);
      
      const post = await service.getById(1);
      expect(post?.view_count).toBe(2);
    });
  });
});
