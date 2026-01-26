# Deployment Runbook

**Last Updated:** 2025-01-26

This runbook covers deployment procedures, monitoring, troubleshooting, and rollback processes for the ImageMagick Node.js wrapper.

## Table of Contents

1. [Deployment Procedures](#deployment-procedures)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Version Release Process](#version-release-process)
4. [Monitoring and Validation](#monitoring-and-validation)
5. [Common Issues and Fixes](#common-issues-and-fixes)
6. [Rollback Procedures](#rollback-procedures)
7. [Post-Deployment Tasks](#post-deployment-tasks)

---

## Deployment Procedures

### Publishing to npm

This package is published to the npm registry. Only maintainers with publish access should perform releases.

#### Automated Release Steps

```bash
# 1. Ensure you're on main branch
git checkout main
git pull origin main

# 2. Run full test suite
npm run test:run

# 3. Run type checking
npm run typecheck

# 4. Build the project
npm run build

# 5. Version bump (choose one)
npm version patch   # 1.0.0 -> 1.0.1 (bug fixes)
npm version minor   # 1.0.0 -> 1.1.0 (new features)
npm version major   # 1.0.0 -> 2.0.0 (breaking changes)

# 6. Publish to npm
npm publish

# 7. Push tags and commits
git push origin main --tags
```

#### Verification After Publish

```bash
# Verify package on npm
npm view imagemagick-nodejs

# Test fresh install in a separate directory
cd /tmp/test-install
npm init -y
npm install imagemagick-nodejs
node -e "const im = require('imagemagick-nodejs'); console.log(Object.keys(im));"
```

### GitHub Release

After publishing to npm:

1. Go to GitHub Releases page
2. Click "Draft a new release"
3. Tag: Select the newly created tag
4. Title: Use version number (e.g., "v1.0.1")
5. Description: Include changelog notes
6. Publish release

---

## Pre-Deployment Checklist

Complete ALL items before deploying:

### Code Quality
- [ ] All tests pass: `npm run test:run`
- [ ] Type checking passes: `npm run typecheck`
- [ ] Linting passes: `npm run lint`
- [ ] Code formatted: `npm run format:check`
- [ ] Build succeeds: `npm run build`

### Documentation
- [ ] README.md updated with new features
- [ ] API documentation current
- [ ] Changelog updated
- [ ] Breaking changes documented

### Testing
- [ ] Unit tests cover new code
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] Edge cases tested

### Version Management
- [ ] Version number appropriately bumped
- [ ] git tags follow semver convention
- [ ] package.json version matches git tag

---

## Version Release Process

### Semantic Versioning

This project follows [Semantic Versioning 2.0.0](https://semver.org/):

- **MAJOR**: Incompatible API changes
- **MINOR**: Backwards-compatible functionality additions
- **PATCH**: Backwards-compatible bug fixes

### Version Bump Decision Tree

```
Does this change break existing API?
  YES -> MAJOR version bump
  NO  ->
    Does this add new functionality?
      YES -> MINOR version bump
      NO  -> PATCH version bump (bug fix)
```

### Changelog Format

Maintain a CHANGELOG.md at the project root:

```markdown
# Changelog

## [1.0.1] - 2025-01-26

### Added
- New `extractPalette()` utility function

### Fixed
- Fixed gravity option in composite command
- Corrected type definitions for stream operations

### Changed
- Improved error messages for missing binaries

### Deprecated
- (None)

### Removed
- (None)

### Security
- (None)
```

---

## Monitoring and Validation

### Post-Deployment Validation

After publishing to npm:

1. **Install Test**
   ```bash
   npm install -g imagemagick-nodejs@latest
   ```

2. **Import Test**
   ```bash
   # Test in fresh project
   node -e "import('imagemagick-nodejs').then(m => console.log('OK'))"
   ```

3. **Type Definitions**
   ```bash
   # Verify TypeScript types work
   npx tsc --noEmit --esModuleInterop node_modules/imagemagick-nodejs/dist/index.d.ts
   ```

4. **Basic Functionality**
   ```typescript
   import { imageMagick } from 'imagemagick-nodejs';
   // Test basic operation
   await imageMagick('test.jpg').resize(100, 100).toFile('output.jpg');
   ```

### npm Registry Monitoring

Monitor these metrics after release:

- **Downloads**: Check npm trends for download counts
- **Dependents**: Watch for new dependent packages
- **Issues**: Monitor GitHub issues for regression reports

```bash
# View package statistics
npm view imagemagick-nodejs

# Check download stats (requires npm-cli-login)
npm downloads imagemagick-nodejs
```

---

## Common Issues and Fixes

### Issue 1: Publish Fails - "403 Forbidden"

**Cause**: Not logged in or lack of permissions

**Solution**:
```bash
# Login to npm
npm login

# Verify authentication
npm whoami

# Retry publish
npm publish
```

### Issue 2: Build Artifacts Missing

**Cause**: `prepublishOnly` hook failed or dist directory excluded

**Solution**:
```bash
# Ensure dist is built
npm run build

# Verify dist directory contents
ls -la dist/

# Check files array in package.json includes "dist"
# Should be: "files": ["dist", "vendor"]
```

### Issue 3: Post-Install Script Fails

**Cause**: install.js not built or failed to compile

**Solution**:
```bash
# Check install script is built
ls -la dist/install.js

# Rebuild with tsup
npx tsup src/scripts/install.ts --format cjs --outDir dist

# Verify postinstall runs
npm run postinstall
```

### Issue 4: Type Definitions Incorrect

**Cause**: Declaration files out of sync with source

**Solution**:
```bash
# Clean rebuild
rm -rf dist/
npm run build

# Verify .d.ts files exist
ls -la dist/*.d.ts

# Test with TypeScript
npx tsc --noEmit
```

### Issue 5: Tests Pass Locally, Fail on CI

**Cause**: Platform-specific differences or ImageMagick version mismatch

**Solution**:
```bash
# Check ImageMagick version
magick -version

# Ensure tests account for platform differences
# Windows uses 'magick' command, macOS/Linux may use 'convert'

# Add platform-specific skips if needed
if (process.platform === 'win32') {
  // Windows-specific test
}
```

### Issue 6: Import Errors After Install

**Cause**: Module resolution or export mismatch

**Solution**:
```bash
# Verify package.json exports field
# Should match the actual built files

# Check entry points exist
ls -la dist/index.js
ls -la dist/index.mjs
ls -la dist/index.d.ts

# Test both ESM and CJS imports
node -e "const im = require('imagemagick-nodejs');"
node -e "import('imagemagick-nodejs').then(m => console.log(m));"
```

---

## Rollback Procedures

### Emergency Rollback

If a critical issue is found post-release:

#### Option 1: Unpublish (Within 72 hours)

```bash
# Force unpublish (only works within 72 hours of publish)
npm unpublish imagemagick-nodejs@1.0.1 --force

# Publish previous version
npm publish --tag previous-version-tag
```

**WARNING**: Unpublishing is disruptive to users. Avoid if possible.

#### Option 2: Publish Patch Fix (Recommended)

```bash
# Fix the issue in code
git checkout main
# ... make fixes ...

# Bump patch version
npm version patch

# Publish fix
npm publish

# Announce fix in issues/documentation
```

#### Option 3: Deprecate Version

```bash
# Deprecate the problematic version
npm deprecate imagemagick-nodejs@1.0.1 "Critical bug in resize operation, please use 1.0.2"

# This warns users but doesn't break existing installs
```

### Rollback Decision Tree

```
How critical is the issue?
  CRITICAL (data loss, security)
    -> Unpublish if < 72 hours old
    -> Otherwise, deprecate + emergency patch

  HIGH (broken core functionality)
    -> Publish patch fix immediately
    -> Communicate via issue tracker

  MEDIUM (edge case broken)
    -> Document workaround
    -> Include fix in next release

  LOW (typo, minor docs issue)
    -> Fix in next release
```

---

## Post-Deployment Tasks

### Immediate (Day 0-1)

- [ ] Monitor GitHub issues for regression reports
- [ ] Respond to any bug reports within 24 hours
- [ ] Verify npm download metrics are recording

### Short Term (Week 1)

- [ ] Address any reported issues
- [ ] Update documentation based on user feedback
- [ ] Prepare patch release if critical issues found

### Long Term (Month 1)

- [ ] Analyze download trends and user feedback
- [ ] Plan roadmap for next version
- [ ] Update runbook with lessons learned

---

## Maintenance Schedule

### Weekly

- Check for new GitHub issues
- Review dependabot alerts
- Ensure tests are passing on main branch

### Monthly

- Update dependencies (test before merging)
- Review and update documentation
- Analyze npm download trends

### Quarterly

- Security audit of dependencies
- Performance benchmarking
- Roadmap review and planning

---

## Incident Response

### Severity Levels

| Severity | Description | Response Time |
|----------|-------------|---------------|
| P0 - Critical | Security vulnerability, data loss | 4 hours |
| P1 - High | Core functionality broken | 24 hours |
| P2 - Medium | Edge case failure, workaround exists | 1 week |
| P3 - Low | Cosmetic, documentation issues | Next release |

### Incident Communication

For P0/P1 incidents:

1. Create GitHub issue with "incident" label
2. Pin issue to repository
3. Provide regular updates on fix progress
4. Announce fix via release notes

---

## Contact and Escalation

- **Maintainer**: [GitHub username]
- **Emergency Contact**: [email]
- **Issue Tracker**: https://github.com/[username]/imagemagick-nodejs/issues
- **Discussions**: https://github.com/[username]/imagemagick-nodejs/discussions

---

## Appendix

### Useful Commands

```bash
# Check current version
npm view imagemagick-nodejs version

# List all published versions
npm view imagemagick-nodejs versions --json

# Compare package versions
npm dist-tag ls imagemagick-nodejs

# Add dist tag
npm dist-tag add imagemagick-nodejs@1.0.0 latest

# Check who has publish access
npm owner ls imagemagick-nodejs

# Add publisher
npm owner add username imagemagick-nodejs
```

### Related Documentation

- [CONTRIB.md](CONTRIB.md) - Contributing guide
- [README.md](../README.md) - Project documentation
- npm Publishing: https://docs.npmjs.com/cli/v8/commands/npm-publish
