# Distribution Testing Setup - Complete

## What Was Created

### Scripts

1. **`scripts/test-local-distribution.js`**
   - Automated testing of full distribution
   - Creates `.test-consumer/` directory with realistic setup
   - Builds, packs, and installs all packages from tarballs
   - Validates CLI and setup

2. **`scripts/link-for-development.js`**
   - Quick development setup using PNPM link
   - Creates global symlinks for fast iteration
   - No need to rebuild/reinstall for each change

### Documentation

1. **`docs/LOCAL_TESTING_GUIDE.md`**
   - Comprehensive guide covering all methods
   - Detailed pros/cons for each approach
   - Troubleshooting section
   - Pre-publish checklist

2. **`docs/QUICK_START_LOCAL_TESTING.md`**
   - Quick reference for common tasks
   - TL;DR commands
   - Common issues and fixes

### Package.json Updates

Added new scripts:
- `pnpm run test:distribution` - Full realistic testing
- `pnpm run link:dev` - Fast development iteration

### Git Configuration

Updated `.gitignore`:
- Added `.test-consumer/` directory
- Added `*.tgz` files

## How to Use

### Quick Test

```bash
pnpm run test:distribution
cd .test-consumer
pnpm generate
```

### Development

```bash
pnpm run link:dev
# Then link in your test project
```

## What This Enables

### Pre-NPM Publishing Testing

✅ **Realistic Consumer Experience**
- Test exactly how users will install your library
- Validate package.json configuration
- Verify exports, files, and dependencies
- Test CLI binary works correctly

✅ **Fast Development Iteration**
- Use `link:dev` for quick testing
- No need to reinstall after each change
- Great for debugging

✅ **External Testing**
- Share `.tgz` files with testers
- Test on different machines
- Validate cross-platform functionality

### Distribution Validation

The test script validates:

1. **Build System**
   - All packages compile correctly
   - TypeScript definitions are generated
   - No build errors

2. **Packaging**
   - package.json "files" field is correct
   - All necessary files are included
   - No unnecessary files are packaged

3. **Installation**
   - Dependencies resolve correctly
   - Peer dependencies work
   - No install errors

4. **CLI**
   - Binary is executable
   - Command works
   - Help text displays

5. **Code Generation**
   - Generator can be invoked
   - Code generates without errors
   - Output is valid TypeScript

## Next Steps

### Before First Use

1. Ensure all packages are built:
   ```bash
   pnpm run build
   ```

2. Run the test:
   ```bash
   pnpm run test:distribution
   ```

3. Verify the test consumer:
   ```bash
   cd .test-consumer
   pnpm ssot --version
   pnpm generate
   ```

### Before Publishing to NPM

Complete this checklist:

- [ ] Run `pnpm run test:distribution`
- [ ] Test in `.test-consumer/` directory
- [ ] Copy tarballs to external directory and test
- [ ] Verify CLI works: `pnpm ssot --version`
- [ ] Generate code: `pnpm generate`
- [ ] Check generated code compiles
- [ ] Review package.json fields
- [ ] Update CHANGELOG.md
- [ ] Update version numbers
- [ ] Create git tag
- [ ] Run `pnpm run check:all`

### Publishing

When ready to publish:

```bash
# Update versions
pnpm -r exec npm version patch  # or minor/major

# Final test
pnpm run test:distribution

# Publish (dry run first)
pnpm -r publish --dry-run

# Actual publish
pnpm -r publish --access public

# Tag and push
git push --tags
```

## Technical Details

### Tarball Creation

The script uses `pnpm pack` which:
- Creates a `.tgz` file exactly like npm publish would
- Respects the "files" field in package.json
- Applies .npmignore rules
- Validates package.json
- Creates the same output users will get from npm

### Package Installation

Installs from local tarballs:
- Tests dependency resolution
- Validates peer dependencies
- Checks for missing files
- Verifies exports work correctly

### Test Consumer Structure

```
.test-consumer/
├── node_modules/
│   └── @ssot-codegen/
│       ├── cli/
│       ├── gen/
│       ├── sdk-runtime/
│       ├── templates-default/
│       └── core/
├── package.json
├── schema.prisma
├── README.md
└── *.tgz (all package tarballs)
```

## Benefits

### Over PNPM Workspace

- Tests actual installation, not symlinks
- Validates packaging configuration
- Catches missing files or wrong exports
- More realistic to user experience

### Over npm link

- More reliable (no symlink issues)
- Tests the actual package structure
- Validates .npmignore and files field
- Catches path resolution issues

### Over Direct Publish

- Safe to test before publishing
- No need to unpublish failed versions
- Can test multiple times
- Can share with testers

## Troubleshooting

### Script Fails to Run

```bash
# Check Node version
node --version  # Should be >= 18

# Check PNPM
pnpm --version

# Rebuild
pnpm run clean:build
pnpm run build
```

### Packages Not Found

```bash
# Verify build outputs exist
ls packages/cli/dist
ls packages/gen/dist

# Rebuild if missing
pnpm run build
```

### CLI Not Working

```bash
# Check binary
ls packages/cli/dist/cli.js

# Check permissions
# (Automatically handled by pnpm)

# Test directly
node packages/cli/dist/cli.js --version
```

## Architecture

### Why This Approach?

1. **Tarball Method** - Most realistic
   - Mimics actual npm publish/install
   - Tests complete package configuration
   - Validates user experience

2. **Link Method** - Fast iteration
   - Immediate feedback
   - No reinstall needed
   - Great for development

3. **Both Available** - Best of both worlds
   - Use link during development
   - Use tarball before release

### Package Dependencies

```
cli
├── gen
│   └── core
├── templates-default
│   └── core
└── sdk-runtime

(Simplified - actual deps in package.json)
```

## Summary

You now have a complete setup for testing your library distribution locally before publishing to npm. This provides:

1. Realistic consumer experience testing
2. Fast development iteration tools
3. Comprehensive validation
4. Safe pre-publish testing
5. External testing capability

Use `pnpm run test:distribution` before any release to ensure everything works correctly for end users.

