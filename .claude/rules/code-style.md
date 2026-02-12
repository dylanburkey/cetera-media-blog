# Code Style Rules

## TypeScript

- Use strict mode
- Prefer `interface` over `type` for object shapes
- Export types for public APIs
- Avoid `any` - use `unknown` if type is truly unknown
- Use const assertions for literals

## Astro Components

- Props interface at top of frontmatter
- Destructure props with defaults
- Use scoped styles (`<style>` not `<style is:global>`)
- Semantic HTML elements
- ARIA attributes for accessibility

## CSS

- Use CSS custom properties for theming
- BEM-like naming: `.component`, `.component-element`, `.component--modifier`
- Mobile-first responsive design
- Prefer `gap` over margins for spacing
- Use `clamp()` for fluid typography

## API Routes

- Always return JSON with Content-Type header
- Use proper HTTP status codes
- Validate all input
- Parameterized database queries
- Consistent error response format:
  ```json
  { "success": false, "error": "Error message" }
  ```

## Naming

- Files: `kebab-case` for routes, `PascalCase` for components
- Variables: `camelCase`
- Constants: `SCREAMING_SNAKE_CASE`
- Types/Interfaces: `PascalCase`

## Comments

- JSDoc for exported functions
- Inline comments for complex logic only
- TODO format: `// TODO: description`
