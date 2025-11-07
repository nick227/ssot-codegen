# NPM Release Guide for SSOT Codegen

**Last Updated:** November 7, 2025  
**Current Version:** 0.4.0  
**Status:** Production Ready ✅

---

## 📋 Overview

This guide provides a comprehensive process for releasing SSOT Codegen packages to NPM.

---

## 🎯 Package Structure

The monorepo contains 5 publishable packages:

| Package | Description | Exports |
|---------|-------------|---------|
| `@ssot-codegen/cli` | Command-line interface | Binary: `ssot` |
| `@ssot-codegen/gen` | Code generation engine | Library |
| `@ssot-codegen/core` | Core types and utilities | Library |
| `@ssot-codegen/templates-default` | Default templates | Library |
| `@ssot-codegen/sdk-runtime` | Runtime SDK | Library |

---

## ✅ Pre-Release Checklist

### 1. Code Quality

```bash
# Run all checks
pnpm run check:all

# This runs:
# - Type checking
# - Linting
# - Knip (dead code detection)
# - Madge (circular dependency detection)
```

### 2. Tests

```bash
# Run generator tests
pnpm test:generator

# Run generated project tests
pnpm test:generated

# Full test suite
pnpm run full-test
```

### 3. Build Artifacts

```bash
# Clean all build artifacts
pnpm run clean:build

# Build all packages
pnpm run build

# Verify build outputs
ls -la packages/*/dist/
```

### 4. Documentation

- ✅ All README files up to date
- ✅ CHANGELOG.md updated with changes
- ✅ CLI help text accurate
- ✅ API documentation current
- ✅ Examples working and documented

### 5. Dependencies

```bash
# Check for outdated dependencies
pnpm outdated

# Update if needed (carefully!)
pnpm update
```

---

## 🚀 Release Process

### Option 1: Manual Release (Recommended for First Release)

#### Step 1: Version Bump

```bash
# Decide on version type
# - patch: 0.4.0 → 0.4.1 (bug fixes)
# - minor: 0.4.0 → 0.5.0 (new features, backwards compatible)
# - major: 0.4.0 → 1.0.0 (breaking changes)

# Update version in all packages
pnpm -r exec npm version patch  # or minor/major

# This updates:
# - package.json files
# - Creates git tag
```

#### Step 2: Update CHANGELOG.md

```markdown
## [0.5.0] - 2025-11-07

### Added
- New feature X
- New feature Y

### Changed
- Improved Z

### Fixed
- Bug in W
```

#### Step 3: Build and Test

```bash
# Clean and rebuild
pnpm run clean:build
pnpm run build

# Run full test suite
pnpm run full-test

# Test CLI manually
pnpm ssot --version
pnpm ssot list
pnpm ssot generate minimal
```

#### Step 4: Publish to NPM

```bash
# Login to NPM (first time only)
npm login

# Publish all packages
pnpm -r publish --access public

# Or publish individually for more control
cd packages/core && npm publish --access public
cd packages/gen && npm publish --access public
cd packages/cli && npm publish --access public
cd packages/templates-default && npm publish --access public
cd packages/sdk-runtime && npm publish --access public
```

#### Step 5: Create Git Tag and Push

```bash
# Commit all changes
git add .
git commit -m "chore: release v0.5.0"

# Create annotated tag
git tag -a v0.5.0 -m "Release v0.5.0"

# Push to remote
git push origin master
git push origin v0.5.0
```

### Option 2: Automated Release (Future)

Once the project is stable, set up automated releases:

#### Using Semantic Release

```bash
# Install
pnpm add -D semantic-release @semantic-release/changelog @semantic-release/git

# Configure .releaserc.json
{
  "branches": ["master"],
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/changelog",
    "@semantic-release/npm",
    "@semantic-release/git",
    "@semantic-release/github"
  ]
}

# Use conventional commits
# feat: New feature
# fix: Bug fix
# docs: Documentation
# chore: Maintenance
```

#### GitHub Actions

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Build
        run: pnpm run build
      
      - name: Test
        run: pnpm run full-test
      
      - name: Publish
        run: pnpm -r publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

---

## 📝 Version Strategy

### Current: 0.x.x (Pre-1.0)

- **0.4.x** - Bug fixes, minor improvements
- **0.5.x** - New features (can include breaking changes)
- **1.0.0** - First stable release

### Post-1.0: Semantic Versioning

- **Patch** (1.0.1) - Bug fixes only
- **Minor** (1.1.0) - New features, backwards compatible
- **Major** (2.0.0) - Breaking changes

---

## 🔒 NPM Publishing Configuration

### Package Access

All packages are scoped (`@ssot-codegen/*`) and require `--access public`:

```bash
npm publish --access public
```

### NPM Token

For CI/CD, create an automation token:

1. Go to npmjs.com → Account Settings → Access Tokens
2. Generate New Token → Automation
3. Add to GitHub Secrets as `NPM_TOKEN`

### Package Validation

Before publishing, verify:

```bash
# See what files will be included
npm pack --dry-run

# Check package size
npm pack
du -sh *.tgz
```

---

## 🧪 Testing Before Release

### 1. Local Install Test

```bash
# Pack packages locally
cd packages/cli && npm pack
cd packages/gen && npm pack

# Install in a test project
mkdir test-install
cd test-install
npm init -y
npm install ../packages/cli/ssot-codegen-cli-0.5.0.tgz

# Test the CLI
npx ssot --version
npx ssot generate minimal
```

### 2. Example Projects

```bash
# Test all examples
pnpm run examples:all

# Or test individually
pnpm run examples:minimal
pnpm run examples:blog
pnpm run examples:ecommerce
pnpm run examples:ai-chat
```

### 3. Generated Project Validation

```bash
# Generate and test a project
pnpm ssot generate minimal
cd generated/minimal-1
pnpm install
pnpm test:validate
pnpm build
pnpm dev  # Verify it starts
```

---

## 📚 Post-Release Tasks

### 1. Update Documentation

- Update README.md with new version
- Update docs/ if API changed
- Update examples if needed

### 2. Announcement

- Create GitHub Release with notes
- Post to social media (if applicable)
- Update project website

### 3. Monitor

- Watch for issues on GitHub
- Monitor NPM download stats
- Check for user feedback

---

## 🔧 Troubleshooting

### "Package already exists"

```bash
# Versions cannot be republished
# Increment version and try again
npm version patch
npm publish --access public
```

### "Permission denied"

```bash
# Check you're logged in
npm whoami

# Login if needed
npm login

# Verify org access
npm org ls ssot-codegen
```

### "Files missing from package"

```bash
# Check files field in package.json
# Verify dist/ is built
# Check .npmignore doesn't exclude needed files

# Test what gets included
npm pack --dry-run
```

### Build fails on CI

```bash
# Ensure prepublishOnly runs build
# Check Node version matches (18+)
# Verify all dependencies installed
```

---

## 📋 Release Checklist Template

Copy this for each release:

```markdown
## Release vX.Y.Z Checklist

- [ ] All tests passing (`pnpm run full-test`)
- [ ] All checks passing (`pnpm run check:all`)
- [ ] CHANGELOG.md updated
- [ ] Version bumped in all packages
- [ ] Clean build completed (`pnpm run clean:build && pnpm run build`)
- [ ] Examples tested
- [ ] CLI tested manually
- [ ] Local install test passed
- [ ] Published to NPM
- [ ] Git tag created and pushed
- [ ] GitHub Release created
- [ ] Documentation updated
- [ ] Announcement made (if applicable)
```

---

## 🎯 First Production Release (1.0.0)

When ready for 1.0.0:

1. **Stability**: All major bugs fixed
2. **API Frozen**: No more breaking changes without major version
3. **Documentation**: Complete and accurate
4. **Examples**: All working and tested
5. **Performance**: Optimized and benchmarked
6. **Security**: Audited and secure
7. **Support**: Ready to maintain long-term

---

## 📞 Support

**Questions?** 
- GitHub Issues: https://github.com/ssot-codegen/ssot-codegen/issues
- Documentation: https://github.com/ssot-codegen/ssot-codegen/docs

**Maintainers:**
- Review this guide before each release
- Update this guide as process evolves
- Keep checklist current with actual workflow

---

**Last successful release:** v0.4.0  
**Next planned release:** v0.5.0  
**Target date:** TBD

