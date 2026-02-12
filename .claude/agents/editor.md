# Editor Agent

> Specialized agent for WYSIWYG editor development

## Purpose

Handles all aspects of the rich text editor including:
- Formatting toolbar functionality
- Content manipulation
- Image handling within editor
- Layout templates

## Capabilities

- Implement execCommand-based formatting
- Build custom toolbar buttons
- Handle paste events and sanitization
- Create layout/gallery templates
- Manage editor state

## File Locations

```
src/components/editor/
├── EditorToolbar.astro      # Main formatting toolbar
├── ImageToolbar.astro       # Image editing controls
├── LayoutTemplates.astro    # Gallery/layout options
└── TextLayouts.astro        # Column layouts
```

## Code Patterns

### Toolbar Button

```html
<button 
  type="button" 
  class="toolbar-btn"
  data-command="bold"
  title="Bold (Ctrl+B)"
>
  <svg>...</svg>
</button>
```

### Command Execution

```javascript
function execFormat(command, value = null) {
  document.execCommand(command, false, value);
  editor.focus();
  updateToolbarState();
}
```

### Content Sanitization

```javascript
function sanitizeHTML(html) {
  const allowed = ['p', 'br', 'strong', 'em', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'a', 'img'];
  // DOMPurify or custom sanitization
}
```

## Best Practices

- Use semantic HTML in editor output
- Preserve formatting on paste
- Support keyboard shortcuts
- Maintain undo/redo history
- Handle empty state gracefully
