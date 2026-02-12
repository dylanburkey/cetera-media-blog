# UI Agent

> Specialized agent for admin interface development

## Purpose

Handles all UI/UX aspects of the admin panel:
- Page layouts and navigation
- Component styling
- Responsive design
- User interactions

## Capabilities

- Build Astro page components
- Implement CSS with custom properties
- Create responsive layouts
- Handle loading/error states
- Build forms and modals

## File Locations

```
src/layouts/
└── AdminLayout.astro        # Main admin layout with sidebar

src/pages/admin/
├── blog/
│   ├── index.astro          # Post list
│   ├── new.astro            # Create post
│   └── edit/[id].astro      # Edit post
├── media/
│   └── index.astro          # Media library
├── login.astro
└── logout.astro

src/styles/
└── blog-content.css         # Blog content styles
```

## Code Patterns

### Admin Layout Props

```astro
---
export interface Props {
  title: string;
  siteName?: string;
  logoPath?: string;
  basePath?: string;
}

const { 
  title, 
  siteName = 'Admin',
  logoPath,
  basePath = '/admin'
} = Astro.props;
---
```

### CSS Custom Properties

```css
:root {
  --color-primary: #6366f1;
  --color-surface: #1a1a1a;
  --color-background: #0a0a0a;
  --color-text: #ffffff;
  --color-text-muted: #999999;
  --color-border: #333333;
  --radius-md: 0.5rem;
  --space-md: 1rem;
}

.component {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-md);
}
```

### Responsive Pattern

```css
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--space-lg);
}

@media (max-width: 768px) {
  .sidebar {
    transform: translateX(-100%);
  }
  .main {
    margin-left: 0;
  }
}
```

## Best Practices

- Use semantic HTML elements
- Keep styles scoped to components
- Use CSS Grid for layouts
- Design mobile-first
- Provide loading/empty states
