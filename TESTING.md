# Testing Guide

This project uses [Vitest](https://vitest.dev/) for testing.

## Running Tests

```bash
# Run all tests once
pnpm test

# Run tests in watch mode (re-runs on file changes)
pnpm test:watch

# Run tests with coverage report
pnpm test:coverage

# Run tests with UI (browser-based interface)
pnpm test:ui
```

## Test Structure

```
tests/
├── setup.ts              # Global test setup and utilities
├── lib/                  # Library/utility tests
│   ├── securityUtils.test.ts
│   ├── componentManager.test.ts
│   └── schema.test.ts
├── api/                  # API service tests
│   ├── blog.test.ts
│   ├── media.test.ts
│   └── auth.test.ts
└── utils/               # Utility function tests
    └── seo.test.ts
```

## Test Coverage

Coverage thresholds are configured in `vitest.config.ts`:

| Metric | Threshold |
|--------|-----------|
| Lines | 80% |
| Functions | 80% |
| Branches | 70% |
| Statements | 80% |

Run `pnpm test:coverage` to generate a coverage report.

## Writing Tests

### Basic Test Structure

```typescript
import { describe, it, expect, beforeEach } from 'vitest';

describe('MyFeature', () => {
  let instance: MyClass;

  beforeEach(() => {
    instance = new MyClass();
  });

  describe('methodName', () => {
    it('should do something', () => {
      const result = instance.methodName();
      expect(result).toBe(expected);
    });

    it('should handle edge case', () => {
      expect(() => instance.methodName(null)).toThrow();
    });
  });
});
```

### Using Global Utilities

The `tests/setup.ts` file provides global utilities:

```typescript
import { wait, mockDate } from '../setup';

it('should handle async operation', async () => {
  await wait(100);
  // ...
});

it('should use mocked date', () => {
  const restore = mockDate('2024-01-15');
  // Date.now() returns mocked timestamp
  restore();
});
```

### Mocking

```typescript
import { vi } from 'vitest';

// Mock a function
const mockFn = vi.fn().mockReturnValue('result');

// Mock a module
vi.mock('./module', () => ({
  default: vi.fn(),
  namedExport: vi.fn()
}));

// Spy on a method
vi.spyOn(console, 'log').mockImplementation(() => {});
```

## Test Categories

### Security Tests (`tests/lib/securityUtils.test.ts`)
- HTML sanitization (XSS prevention)
- Input escaping
- CSRF token generation
- Slug validation
- Filename sanitization

### Component Manager Tests (`tests/lib/componentManager.test.ts`)
- Component registration
- Prop updates and version tracking
- History management (undo support)
- Different component types (image, layout, gallery)

### Schema Tests (`tests/lib/schema.test.ts`)
- JSON-LD article schema generation
- FAQ detection and schema
- HowTo step detection
- Reading time calculation

### Blog API Tests (`tests/api/blog.test.ts`)
- Post CRUD operations
- Slug generation and validation
- Excerpt auto-generation
- Filtering and pagination
- View count tracking

### Media API Tests (`tests/api/media.test.ts`)
- File upload validation
- Type and size restrictions
- Filename sanitization
- Media library management

### Auth Tests (`tests/api/auth.test.ts`)
- User registration
- Login/logout flow
- Session management
- Password validation
- Role-based permissions

### SEO Tests (`tests/utils/seo.test.ts`)
- Meta title/description generation
- Canonical URL handling
- OG image generation
- Sitemap generation
- SEO field validation

## CI Integration

Tests run automatically on:
- Pull requests to `main` and `dev`
- Push to `main` and `dev`

See `.github/workflows/test.yml` for configuration.
