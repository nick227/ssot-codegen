# Quick Start: Local Testing

## TL;DR

Test your library locally before publishing to npm:

```bash
# Most realistic (recommended before release)
pnpm run test:distribution

# Fast development iteration
pnpm run link:dev
```

## Method 1: Tarball Testing (Recommended)

**Best for:** Final validation before npm publish

```bash
pnpm run test:distribution
```

This creates a test consumer project in `.test-consumer/` with:
- ✅ Actual `.tgz` packages (like npm would create)
- ✅ Real installation experience
- ✅ Sample schema.prisma
- ✅ Working CLI

### Test It

```bash
cd .test-consumer
pnpm ssot --version
pnpm generate
ls generated
```

### What It Tests

- Package installation works
- CLI binary is accessible
- All dependencies resolve correctly
- Exports are configured properly
- Generated code works

## Method 2: Development Linking

**Best for:** Active development with fast iteration

```bash
pnpm run link:dev
```

Then in your test project:

```bash
mkdir my-test
cd my-test
pnpm init

pnpm link --global @ssot-codegen/cli
pnpm link --global @ssot-codegen/gen
pnpm link --global @ssot-codegen/sdk-runtime
pnpm link --global @ssot-codegen/templates-default
pnpm link --global @ssot-codegen/core
```

### What It Tests

- Changes reflect immediately
- No reinstall needed
- Great for debugging

## Common Issues

### CLI not found

```bash
# Check installation
pnpm list @ssot-codegen/cli

# Try direct path
node node_modules/@ssot-codegen/cli/dist/cli.js --version
```

### Module not found

```bash
# Rebuild everything
pnpm run clean:build
pnpm run build
```

### Old version showing

```bash
# With tarball method: regenerate
pnpm run test:distribution

# With link method: rebuild
cd packages/cli
pnpm run build
```

## Testing in External Project

To test in a completely separate project:

```bash
# 1. Create tarballs
pnpm run test:distribution

# 2. Copy .tgz files to your project
cp .test-consumer/*.tgz /path/to/your/project/

# 3. Install them
cd /path/to/your/project
pnpm add ./ssot-codegen-cli-0.4.0.tgz
pnpm add ./ssot-codegen-gen-0.4.0.tgz
# ... etc
```

## Cleanup

```bash
# Remove test consumer
Remove-Item -Recurse -Force .test-consumer

# Remove tarballs
Remove-Item packages\*\*.tgz

# Unlink packages
pnpm unlink --global @ssot-codegen/cli
# ... repeat for each package
```

## Pre-Release Checklist

- [ ] `pnpm run test:distribution` works
- [ ] CLI command works in test consumer
- [ ] Code generation completes successfully
- [ ] Generated code has no TypeScript errors
- [ ] Tested in external directory
- [ ] Documentation is up to date
- [ ] Version numbers are correct

## Full Documentation

See [LOCAL_TESTING_GUIDE.md](./LOCAL_TESTING_GUIDE.md) for complete details.

