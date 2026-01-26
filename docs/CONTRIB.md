# Contributing Guide

**Last Updated:** 2025-01-26

This guide covers the development workflow for contributing to the ImageMagick Node.js wrapper.

## Prerequisites

Before contributing, ensure you have:

- **Node.js** >= 18.0.0
- **ImageMagick 7.x** installed on your system
  - Windows: Download from [imagemagick.org](https://imagemagick.org/script/download.php#windows)
  - macOS: `brew install imagemagick`
  - Linux: `apt install imagemagick` or equivalent
- **Yarn** or **npm** for package management
- **Git** for version control

## Development Workflow

### 1. Fork and Clone

```bash
# Fork the repository on GitHub
git clone https://github.com/YOUR_USERNAME/imagemagick-nodejs.git
cd imagemagick-nodejs
```

### 2. Install Dependencies

```bash
yarn install
# or
npm install
```

### 3. Development Mode

```bash
# Start build watcher
yarn dev
# or
npm run dev
```

This watches for changes and rebuilds the project automatically.

## Available Scripts

| Script | Description | Usage |
|--------|-------------|-------|
| `build` | Build the project for production | `yarn build` |
| `dev` | Watch mode - rebuild on changes | `yarn dev` |
| `lint` | Run ESLint on source files | `yarn lint` |
| `lint:fix` | Auto-fix ESLint issues | `yarn lint:fix` |
| `format` | Format code with Prettier | `yarn format` |
| `format:check` | Check code formatting | `yarn format:check` |
| `typecheck` | Run TypeScript type checking | `yarn typecheck` |
| `test` | Run tests in watch mode | `yarn test` |
| `test:run` | Run tests once | `yarn test:run` |
| `postinstall` | Runs automatically after install (builds) | Automatic |
| `prepublishOnly` | Runs before npm publish (builds) | Automatic |

### Pre-Commit Checklist

Before pushing changes, run:

```bash
# 1. Type check
yarn typecheck

# 2. Lint
yarn lint

# 3. Fix any issues
yarn lint:fix
yarn format

# 4. Run tests
yarn test:run
```

## Project Structure

```
imagemagick-nodejs/
├── src/
│   ├── api/              # High-level fluent API
│   ├── commands/         # ImageMagick command wrappers
│   ├── core/             # Core execution and types
│   ├── scripts/          # Build/install scripts
│   └── utils/            # Utility functions
├── tests/                # Test files
├── examples/             # Usage examples
├── docs/                 # Documentation
└── dist/                 # Built output (generated)
```

### Key Modules

| Module | Purpose |
|--------|---------|
| `api/ImageMagick.ts` | High-level fluent/chainable API |
| `core/executor.ts` | Command execution engine |
| `core/binary.ts` | Binary detection and management |
| `commands/convert.ts` | Convert command wrapper |
| `commands/identify.ts` | Image information extraction |
| `commands/mogrify.ts` | Batch in-place operations |
| `commands/composite.ts` | Image composition |
| `commands/montage.ts` | Image montage creation |
| `commands/compare.ts` | Image comparison |
| `commands/animate.ts` | Animation creation |
| `utils/errors.ts` | Custom error classes |
| `utils/formats.ts` | Format utilities and constants |
| `utils/batch.ts` | Batch processing utilities |

## Coding Standards

### TypeScript Configuration

- Target: ES2020
- Module: CommonJS
- Strict mode enabled
- `noUncheckedIndexedAccess`: enabled for safety

### Code Style (Prettier)

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "endOfLine": "lf"
}
```

### Naming Conventions

- **Files**: `camelCase.ts` for utilities, `PascalCase.ts` for classes
- **Exports**: `camelCase` for functions, `PascalCase` for classes/types
- **Constants**: `UPPER_SNAKE_CASE`
- **Private members**: Prefix with `_`

### Documentation

- Use JSDoc/TSDoc comments for all public APIs
- Include `@example` blocks for non-trivial functions
- Add `@throws` for functions that can throw errors

```typescript
/**
 * Resizes an image to the specified dimensions.
 *
 * @param filePath - Path to the input image
 * @param width - Target width in pixels
 * @param height - Target height in pixels
 * @returns Promise that resolves when complete
 *
 * @example
 * ```ts
 * await resizeImage('photo.jpg', 800, 600);
 * ```
 */
export async function resizeImage(filePath: string, width: number, height: number): Promise<void> {
  // ...
}
```

## Testing

### Running Tests

```bash
# Watch mode (recommended during development)
yarn test

# Single run
yarn test:run

# Coverage report
yarn test:run -- --coverage
```

### Writing Tests

Tests are located in `tests/` directory and use Vitest.

```typescript
import { describe, it, expect } from 'vitest';
import { convert } from 'imagemagick-nodejs';

describe('convert', () => {
  it('should resize an image', async () => {
    const result = await convert('test.jpg')
      .resize(800, 600)
      .output('output.jpg')
      .run();

    expect(result.exitCode).toBe(0);
  });
});
```

### Test Organization

- `tests/commands.test.ts` - Test command wrappers
- `tests/utils.test.ts` - Test utility functions
- Add new test files as needed

## Pull Request Process

### 1. Branch Naming

Use descriptive branch names:

```
feature/add-watermark-support
fix/resize-crop-behavior
docs/update-api-reference
refactor/optimize-executor
```

### 2. Commit Messages

Follow conventional commits:

```
feat: add support for HEIC format
fix: correct gravity option in composite
docs: update contributing guide
refactor: simplify error handling
test: add coverage for batch operations
```

### 3. PR Description Template

```markdown
## Summary
Brief description of changes.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tests added/updated
- [ ] All tests pass

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No new warnings generated
```

## Release Process

Releases are managed by maintainers:

1. Version bump in `package.json`
2. Update CHANGELOG.md
3. Create git tag
4. Publish to npm

## Troubleshooting

### Build Issues

**Problem**: Build fails with type errors

**Solution**:
```bash
yarn typecheck
# Fix reported errors or add type assertions
```

**Problem**: Build succeeds but tests fail

**Solution**:
```bash
# Ensure ImageMagick is installed
magick -version

# Check test output for specific failures
yarn test:run --reporter=verbose
```

### Lint Issues

**Problem**: ESLint reports errors

**Solution**:
```bash
yarn lint:fix
# If issues remain, fix manually
```

### Module Resolution Issues

**Problem**: Import errors after build

**Solution**:
```bash
# Clean and rebuild
rm -rf dist node_modules
yarn install
yarn build
```

## Getting Help

- **GitHub Issues**: Report bugs and request features
- **Discussions**: Ask questions and share ideas
- **Documentation**: See [README.md](../README.md) for API reference

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
