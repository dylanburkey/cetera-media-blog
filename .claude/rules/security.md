# Security Rules

## Authentication

- Hash passwords with PBKDF2 (100,000 iterations minimum)
- Session tokens: cryptographically random, 256 bits
- Cookies: `httpOnly`, `secure`, `sameSite: lax`
- Session expiry: 7 days default, refresh on activity

## Database

- ALWAYS use parameterized queries
- Never interpolate user input into SQL
- Validate and sanitize all input
- Use prepared statements with `.bind()`

```typescript
// ✅ CORRECT
await db.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first();

// ❌ WRONG - SQL injection vulnerability
await db.prepare(`SELECT * FROM users WHERE id = ${userId}`).first();
```

## Input Validation

- Validate on server, not just client
- Sanitize HTML content (DOMPurify or equivalent)
- Check file types for uploads
- Limit upload sizes
- Validate slugs against allowlist pattern

## Headers

- Set `Content-Type` on all responses
- Consider CSP headers for admin pages
- No sensitive data in error messages to client

## Secrets

- Never commit secrets to git
- Use environment variables
- Rotate credentials if exposed
