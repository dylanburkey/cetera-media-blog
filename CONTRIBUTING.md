# Contributing to Astro Blog CMS

Thanks for your interest in contributing! This document outlines how to get started.

## Development Setup

```bash
# Clone the repo
git clone https://github.com/dylanburkey/astro-blog-cms.git
cd astro-blog-cms

# Install dependencies
pnpm install

# Run type checking
pnpm typecheck

# Run linter
pnpm lint

# Build the package
pnpm build
```

## Project Structure

```
astro-blog-cms/
├── .changeset/          # Changeset config for versioning
├── .github/workflows/   # CI/CD workflows
├── examples/            # Example projects
├── migrations/          # D1 database migrations
├── src/
│   ├── components/      # Astro components
│   │   ├── blog/        # Public blog components
│   │   └── editor/      # WYSIWYG editor components
│   ├── layouts/         # Admin layout
│   ├── lib/             # Auth & utilities
│   ├── pages/admin/     # Admin pages & API routes
│   ├── styles/          # CSS styles
│   ├── utils/           # Helper functions
│   ├── config.ts        # CMS configuration
│   └── index.ts         # Main exports
├── package.json
├── tsconfig.json
├── tsup.config.ts       # Build config
└── pnpm-workspace.yaml
```

## Branching Strategy

- `main` - Production branch, releases are cut from here
- `dev` - Development branch, PRs should target this branch
- Feature branches - `feature/your-feature-name`
- Bug fixes - `fix/bug-description`

## Development Workflow

1. **Create a branch** from `dev`:
   ```bash
   git checkout dev
   git pull origin dev
   git checkout -b feature/your-feature
   ```

2. **Make your changes** and ensure they pass checks:
   ```bash
   pnpm lint
   pnpm typecheck
   pnpm build
   ```

3. **Create a changeset** (for version bumping):
   ```bash
   pnpm changeset
   ```
   Follow the prompts to describe your changes.

4. **Commit** with conventional commits:
   ```bash
   git commit -m "feat: add new feature"
   ```

5. **Push and create a PR** targeting `dev`:
   ```bash
   git push origin feature/your-feature
   ```

## Commit Messages

We use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Formatting, no code change
- `refactor:` Code restructuring
- `test:` Adding tests
- `chore:` Maintenance tasks

## Code Style

- TypeScript for all `.ts` files
- Follow existing patterns in the codebase
- Run `pnpm format` before committing
- Keep components small and focused
- Add JSDoc comments for public APIs

## Testing the Package Locally

```bash
# Build the package
pnpm build

# Test in the example project
cd examples/basic
pnpm dev
```

## Release Process

Releases are automated via GitHub Actions:

1. Changesets accumulate in PRs
2. When merged to `main`, a "Release PR" is created automatically
3. Merging the Release PR publishes to npm

## Questions?

Open an issue or reach out to [@dylanburkey](https://github.com/dylanburkey).

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
