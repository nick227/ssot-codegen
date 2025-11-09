# Local Testing Guide

This guide explains how to test your library distribution before publishing to npm.

## Overview

There are three approaches to test your library locally, each with different levels of realism:

1. **Tarball Installation** (Most Realistic) - Mimics actual npm install
2. **PNPM Link** (Development) - Fast iteration with symlinks
3. **Direct File Path** (Quick Test) - Simplest but least realistic

## Method 1: Tarball Installation (Recommended for Pre-Release Testing)

This method creates actual `.tgz` files like npm would, providing the most realistic testing experience.

### Automatic Setup

Run the automated script:

```bash
pnpm run test:distribution
```

This will:
1. Build all packages
2. Create tarball files (`.tgz`)
3. Set up a test consumer project in `.test-consumer/`
4. Install packages from tarballs
5. Verify the installation

### Test the Consumer

```bash
cd .test-consumer
pnpm ssot --version
pnpm generate
```

### Manual Setup (Alternative)

If you prefer to do it manually:

```bash
# 1. Build packages
pnpm run build

# 2. Pack each package
cd packages/cli
pnpm pack
cd ../gen
pnpm pack
cd ../sdk-runtime
pnpm pack
cd ../templates-default
pnpm pack
cd ../core
pnpm pack

# 3. Create test project
mkdir my-test-project
cd my-test-project
pnpm init

# 4. Install from tarballs
pnpm add ../packages/cli/ssot-codegen-cli-0.4.0.tgz
pnpm add ../packages/gen/ssot-codegen-gen-0.4.0.tgz
pnpm add ../packages/sdk-runtime/ssot-codegen-sdk-runtime-0.4.0.tgz
pnpm add ../packages/templates-default/ssot-codegen-templates-default-0.4.0.tgz
pnpm add ../packages/core/ssot-codegen-core-0.4.0.tgz
```

### When to Use

- ✅ Final validation before npm publish
- ✅ Testing the complete installation flow
- ✅ Verifying package.json exports and files
- ✅ Testing in external projects
- ✅ CI/CD pipeline validation

### Pros & Cons

**Pros:**
- Most realistic to actual npm install
- Tests packaging configuration
- Validates exports, files, and dependencies
- Can share tarballs with testers

**Cons:**
- Slower iteration (need to rebuild and repack)
- Need to reinstall after each change

## Method 2: PNPM Link (Development)

Use symlinks for faster development iteration.

### Automatic Setup

```bash
pnpm run link:dev
```

### Manual Setup

```bash
# In the monorepo root
pnpm run build

# Link packages globally
cd packages/cli && pnpm link --global
cd ../gen && pnpm link --global
cd ../sdk-runtime && pnpm link --global
cd ../templates-default && pnpm link --global
cd ../core && pnpm link --global

# In your test project
mkdir my-test-project
cd my-test-project
pnpm init

pnpm link --global @ssot-codegen/cli
pnpm link --global @ssot-codegen/gen
pnpm link --global @ssot-codegen/sdk-runtime
pnpm link --global @ssot-codegen/templates-default
pnpm link --global @ssot-codegen/core
```

### When to Use

- ✅ Active development and iteration
- ✅ Quick testing of changes
- ✅ Debugging across packages

### Pros & Cons

**Pros:**
- Fast - changes reflect immediately
- No need to reinstall

**Cons:**
- Less realistic than actual install
- Symlinks can cause issues
- Doesn't test packaging

## Method 3: Direct File Path

Install directly from the file system.

```bash
cd my-test-project
pnpm add file:../ssot-codegen/packages/cli
pnpm add file:../ssot-codegen/packages/gen
# etc...
```

### When to Use

- ✅ Quick one-off tests
- ✅ Simple validation

### Pros & Cons

**Pros:**
- Simplest setup

**Cons:**
- Least realistic
- Can have path resolution issues

## Testing External Consumption

To truly test external consumption:

### Option A: Copy Tarballs to Another Machine

```bash
# On development machine
pnpm run test:distribution

# This creates .tgz files in .test-consumer/
# Copy these files to another machine or directory

# On test machine
mkdir external-test
cd external-test
pnpm init

# Copy the .tgz files here, then:
pnpm add ./ssot-codegen-cli-0.4.0.tgz
pnpm add ./ssot-codegen-gen-0.4.0.tgz
pnpm add ./ssot-codegen-sdk-runtime-0.4.0.tgz
pnpm add ./ssot-codegen-templates-default-0.4.0.tgz
pnpm add ./ssot-codegen-core-0.4.0.tgz
```

### Option B: Use Verdaccio (Local NPM Registry)

For the most realistic testing, set up a local npm registry:

```bash
# Install Verdaccio
npm install -g verdaccio

# Run Verdaccio
verdaccio

# In another terminal, configure npm to use local registry
npm set registry http://localhost:4873/

# Publish to local registry
cd packages/cli
npm publish

# In test project
npm install @ssot-codegen/cli

# Don't forget to restore registry after testing
npm set registry https://registry.npmjs.org/
```

## Recommended Testing Workflow

1. **During Development:**
   - Use PNPM Link for fast iteration
   - Run `pnpm run link:dev`

2. **Before Committing:**
   - Use Tarball Installation
   - Run `pnpm run test:distribution`
   - Test in `.test-consumer/`

3. **Before Release:**
   - Use Tarball Installation in external directory
   - Test on different machine if possible
   - Verify all features work as expected

4. **After Release:**
   - Install from npm registry
   - Verify against real-world scenarios

## Cleanup

### Remove Test Consumer

```bash
Remove-Item -Recurse -Force .test-consumer
```

### Unlink Packages

```bash
pnpm unlink --global @ssot-codegen/cli
pnpm unlink --global @ssot-codegen/gen
pnpm unlink --global @ssot-codegen/sdk-runtime
pnpm unlink --global @ssot-codegen/templates-default
pnpm unlink --global @ssot-codegen/core
```

### Remove Tarballs

```bash
Remove-Item packages\*\*.tgz
```

## Troubleshooting

### "Module not found" errors

- Ensure all packages are built: `pnpm run build`
- Check package.json exports configuration
- Verify files are included in package.json "files" field

### "Command not found: ssot"

- Check bin configuration in packages/cli/package.json
- Ensure package is linked/installed correctly
- Try running directly: `node node_modules/@ssot-codegen/cli/dist/cli.js`

### Workspace dependency resolution issues

- Use tarball method instead of link
- Ensure all dependencies are properly listed
- Check for circular dependencies

### Different behavior in test vs monorepo

This indicates a packaging issue:
- Check package.json "files" field
- Verify tsconfig.json outputs to "dist"
- Ensure all required files are included

## Pre-Publish Checklist

Before publishing to npm, verify:

- [ ] All packages build successfully
- [ ] Tarball installation works
- [ ] CLI command works
- [ ] Code generation completes
- [ ] Generated code compiles
- [ ] All exports are accessible
- [ ] README and documentation are up to date
- [ ] Version numbers are consistent
- [ ] LICENSE file exists in each package
- [ ] .npmignore or files field is correct
- [ ] Dependencies vs devDependencies are correct
- [ ] Peer dependencies are specified

## Next Steps

Once testing is complete and everything works:

1. Update CHANGELOG.md
2. Update version numbers: `pnpm -r exec npm version patch` (or minor/major)
3. Create git tag
4. Publish to npm: `pnpm -r publish --access public`
5. Push tags: `git push --tags`

