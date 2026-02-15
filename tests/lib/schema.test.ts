import { describe, it, expect } from 'vitest';

// Schema generation types
interface ArticleSchema {
  '@context': string;
  '@type': string;
  headline: string;
  description?: string;
  image?: string;
  datePublished?: string;
  dateModified?: string;
  author?: PersonSchema;
  publisher?: OrganizationSchema;
  wordCount?: number;
  timeRequired?: string;
}

interface PersonSchema {
  '@type': 'Person';
  name: string;
  url?: string;
}

interface OrganizationSchema {
  '@type': 'Organization';
  name: string;
  logo?: ImageSchema;
}

interface ImageSchema {
  '@type': 'ImageObject';
  url: string;
  width?: number;
  height?: number;
}

interface FAQSchema {
  '@context': string;
  '@type': 'FAQPage';
  mainEntity: FAQItem[];
}

interface FAQItem {
  '@type': 'Question';
  name: string;
  acceptedAnswer: {
    '@type': 'Answer';
    text: string;
  };
}

interface HowToSchema {
  '@context': string;
  '@type': 'HowTo';
  name: string;
  step: HowToStep[];
}

interface HowToStep {
  '@type': 'HowToStep';
  position: number;
  name: string;
  text: string;
}

// Schema generator functions
function generateArticleSchema(data: {
  title: string;
  description?: string;
  image?: string;
  publishDate?: Date;
  modifiedDate?: Date;
  authorName?: string;
  wordCount?: number;
  type?: string;
}): ArticleSchema {
  const schema: ArticleSchema = {
    '@context': 'https://schema.org',
    '@type': data.type || 'Article',
    headline: data.title.substring(0, 110)
  };

  if (data.description) schema.description = data.description;
  if (data.image) schema.image = data.image;
  if (data.publishDate) schema.datePublished = data.publishDate.toISOString();
  if (data.modifiedDate) schema.dateModified = data.modifiedDate.toISOString();
  if (data.wordCount) {
    schema.wordCount = data.wordCount;
    schema.timeRequired = `PT${Math.ceil(data.wordCount / 200)}M`;
  }
  if (data.authorName) {
    schema.author = { '@type': 'Person', name: data.authorName };
  }

  return schema;
}

function detectFAQContent(html: string): FAQItem[] {
  const faqs: FAQItem[] = [];
  const questionRegex = /<h[2-4][^>]*>([^<]*\?[^<]*)<\/h[2-4]>\s*<p>([^<]+)<\/p>/gi;
  
  let match;
  while ((match = questionRegex.exec(html)) !== null) {
    faqs.push({
      '@type': 'Question',
      name: match[1].trim(),
      acceptedAnswer: {
        '@type': 'Answer',
        text: match[2].trim()
      }
    });
  }
  
  return faqs;
}

function generateFAQSchema(faqs: FAQItem[]): FAQSchema | null {
  if (faqs.length === 0) return null;
  
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs
  };
}

function detectHowToSteps(html: string): HowToStep[] {
  const steps: HowToStep[] = [];
  const listRegex = /<ol[^>]*>([\s\S]*?)<\/ol>/gi;
  const itemRegex = /<li[^>]*>([^<]+)<\/li>/gi;
  
  let listMatch;
  while ((listMatch = listRegex.exec(html)) !== null) {
    let itemMatch;
    let position = 1;
    while ((itemMatch = itemRegex.exec(listMatch[1])) !== null) {
      steps.push({
        '@type': 'HowToStep',
        position,
        name: `Step ${position}`,
        text: itemMatch[1].trim()
      });
      position++;
    }
  }
  
  return steps;
}

function generateHowToSchema(title: string, steps: HowToStep[]): HowToSchema | null {
  if (steps.length === 0) return null;
  
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: title,
    step: steps
  };
}

function calculateReadingTime(text: string): number {
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

describe('Schema Generation', () => {
  describe('generateArticleSchema', () => {
    it('should generate basic article schema', () => {
      const schema = generateArticleSchema({
        title: 'Test Article'
      });

      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('Article');
      expect(schema.headline).toBe('Test Article');
    });

    it('should truncate headline to 110 characters', () => {
      const longTitle = 'A'.repeat(150);
      const schema = generateArticleSchema({ title: longTitle });
      
      expect(schema.headline.length).toBe(110);
    });

    it('should include optional fields when provided', () => {
      const publishDate = new Date('2024-01-15');
      const schema = generateArticleSchema({
        title: 'Test',
        description: 'A test description',
        image: '/test.jpg',
        publishDate,
        authorName: 'John Doe',
        wordCount: 1000
      });

      expect(schema.description).toBe('A test description');
      expect(schema.image).toBe('/test.jpg');
      expect(schema.datePublished).toBe(publishDate.toISOString());
      expect(schema.author?.name).toBe('John Doe');
      expect(schema.wordCount).toBe(1000);
    });

    it('should calculate reading time from word count', () => {
      const schema = generateArticleSchema({
        title: 'Test',
        wordCount: 400 // 2 minutes
      });

      expect(schema.timeRequired).toBe('PT2M');
    });

    it('should support different article types', () => {
      const types = ['BlogPosting', 'NewsArticle', 'TechArticle', 'HowTo', 'Review'];
      
      types.forEach(type => {
        const schema = generateArticleSchema({ title: 'Test', type });
        expect(schema['@type']).toBe(type);
      });
    });
  });

  describe('FAQ Detection', () => {
    it('should detect FAQ content from HTML', () => {
      const html = `
        <h2>What is Astro?</h2>
        <p>Astro is a modern web framework.</p>
        <h3>Why use Astro?</h3>
        <p>For better performance and developer experience.</p>
      `;

      const faqs = detectFAQContent(html);
      expect(faqs).toHaveLength(2);
      expect(faqs[0].name).toBe('What is Astro?');
      expect(faqs[0].acceptedAnswer.text).toBe('Astro is a modern web framework.');
    });

    it('should only detect questions (ending with ?)', () => {
      const html = `
        <h2>Introduction</h2>
        <p>This is not a question.</p>
        <h2>What is this?</h2>
        <p>This is a question.</p>
      `;

      const faqs = detectFAQContent(html);
      expect(faqs).toHaveLength(1);
    });

    it('should return empty array for no FAQs', () => {
      const html = '<p>Just regular content here.</p>';
      const faqs = detectFAQContent(html);
      expect(faqs).toHaveLength(0);
    });
  });

  describe('generateFAQSchema', () => {
    it('should generate valid FAQ schema', () => {
      const faqs: FAQItem[] = [
        {
          '@type': 'Question',
          name: 'What is this?',
          acceptedAnswer: { '@type': 'Answer', text: 'A test.' }
        }
      ];

      const schema = generateFAQSchema(faqs);
      expect(schema?.['@type']).toBe('FAQPage');
      expect(schema?.mainEntity).toHaveLength(1);
    });

    it('should return null for empty FAQs', () => {
      expect(generateFAQSchema([])).toBeNull();
    });
  });

  describe('HowTo Detection', () => {
    it('should detect steps from ordered lists', () => {
      const html = `
        <ol>
          <li>First, do this</li>
          <li>Then, do that</li>
          <li>Finally, finish up</li>
        </ol>
      `;

      const steps = detectHowToSteps(html);
      expect(steps).toHaveLength(3);
      expect(steps[0].position).toBe(1);
      expect(steps[0].text).toBe('First, do this');
      expect(steps[2].position).toBe(3);
    });

    it('should handle multiple ordered lists', () => {
      const html = `
        <ol><li>Step A1</li><li>Step A2</li></ol>
        <ol><li>Step B1</li><li>Step B2</li></ol>
      `;

      const steps = detectHowToSteps(html);
      expect(steps).toHaveLength(4);
    });

    it('should return empty array for no lists', () => {
      const html = '<p>No steps here.</p>';
      expect(detectHowToSteps(html)).toHaveLength(0);
    });
  });

  describe('generateHowToSchema', () => {
    it('should generate valid HowTo schema', () => {
      const steps: HowToStep[] = [
        { '@type': 'HowToStep', position: 1, name: 'Step 1', text: 'Do something' }
      ];

      const schema = generateHowToSchema('How to Test', steps);
      expect(schema?.['@type']).toBe('HowTo');
      expect(schema?.name).toBe('How to Test');
    });

    it('should return null for empty steps', () => {
      expect(generateHowToSchema('Test', [])).toBeNull();
    });
  });

  describe('calculateReadingTime', () => {
    it('should calculate reading time at 200 wpm', () => {
      const text200 = 'word '.repeat(200);
      expect(calculateReadingTime(text200)).toBe(1);

      const text400 = 'word '.repeat(400);
      expect(calculateReadingTime(text400)).toBe(2);

      const text1000 = 'word '.repeat(1000);
      expect(calculateReadingTime(text1000)).toBe(5);
    });

    it('should return minimum of 1 minute', () => {
      expect(calculateReadingTime('short')).toBe(1);
      expect(calculateReadingTime('')).toBe(1);
    });

    it('should round up to nearest minute', () => {
      const text250 = 'word '.repeat(250);
      expect(calculateReadingTime(text250)).toBe(2); // 1.25 rounds to 2
    });
  });
});
