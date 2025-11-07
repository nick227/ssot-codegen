# CI/CD Integration Guide

Continuous Integration and Deployment setup for SSOT Codegen.

---

## GitHub Actions

### Workflow File

**Location:** `.github/workflows/ci.yml`

### Jobs

**1. Code Quality & Tests**
- Type checking
- Linting
- Circular dependency detection
- Unused export detection
- Generator unit tests
- Example generation test

**2. Plugin Tests**
- AI plugin tests
- Storage plugin tests
- Payment/Email plugin tests

**3. Generation Tests** (Matrix)
- Tests each example schema
- Verifies generated code compiles
- Runs validation tests

**4. Publish Readiness**
- Version synchronization check
- Bundle size reporting
- Final verification

---

## Running CI Locally

### Full CI Simulation

```bash
# Run all checks (same as CI)
pnpm check:all
```

This runs:
```bash
pnpm typecheck    # TypeScript compilation
pnpm lint         # ESLint
pnpm knip         # Unused exports
pnpm madge        # Circular dependencies
```

### Individual Checks

```bash
# Type checking only
pnpm typecheck

# Linting only
pnpm lint

# Fix lint errors
pnpm lint:fix

# Circular dependencies
pnpm madge

# Unused code
pnpm knip
```

---

## Pre-Commit Checks

### Recommended Git Hooks

Create `.husky/pre-commit`:

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run quality checks
pnpm typecheck || exit 1
pnpm lint || exit 1

echo "✅ Pre-commit checks passed"
```

### Install Husky

```bash
pnpm add -D husky
npx husky install
npx husky add .husky/pre-commit "pnpm check:all"
```

---

## CI Performance

### Current Timings

**Quality job:**
- Install: ~30s
- Build: ~15s
- Type check: ~10s
- Lint: ~5s
- Tests: ~10s
- **Total:** ~70s

**Generation tests** (parallel matrix):
- Per example: ~45s
- 3 examples in parallel: ~45s total

**Total CI time:** ~2 minutes

### Optimization Tips

1. **Cache pnpm store**
   ```yaml
   - uses: actions/setup-node@v4
     with:
       cache: 'pnpm'
   ```

2. **Parallel jobs**
   ```yaml
   strategy:
     matrix:
       example: [minimal, blog, ecommerce]
   ```

3. **Skip unchanged**
   ```yaml
   - uses: dorny/paths-filter@v2
     id: changes
   if: steps.changes.outputs.generator == 'true'
   ```

---

## Release Process

### Manual Release (Current)

```bash
# 1. Update versions
./scripts/bump-version.sh 0.5.0

# 2. Build
pnpm build

# 3. Test
pnpm check:all
pnpm test:generator

# 4. Generate all examples
pnpm examples:all

# 5. Commit
git add -A
git commit -m "chore: release v0.5.0"
git tag v0.5.0

# 6. Push (only when instructed!)
# git push origin master --tags
```

### Automated Release (Future)

Consider using:
- **changesets** - Version management
- **semantic-release** - Automated releases
- **GitHub Releases** - Changelog generation

---

## Environment Variables in CI

### Required Secrets

For full plugin testing with live APIs (optional):

```yaml
# GitHub Settings → Secrets and variables → Actions

OPENAI_API_KEY          # For OpenAI integration tests
GOOGLE_CLIENT_ID        # For OAuth tests
GOOGLE_CLIENT_SECRET    # For OAuth tests
DATABASE_URL            # For database tests
```

### Using Secrets

```yaml
steps:
  - name: Test with API keys
    env:
      OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
    run: pnpm test:integration
```

---

## Quality Gates

### Required Checks

All PRs must pass:
- ✅ TypeScript compilation
- ✅ ESLint (no errors)
- ✅ No circular dependencies
- ✅ Generator tests pass
- ✅ At least one example generates successfully

### Optional Checks

- ⚠️ Knip warnings (unused exports)
- ⚠️ Test coverage %
- ⚠️ Bundle size increase

---

## Deployment Strategies

### Generated Projects

Each generated project can be deployed independently:

#### Vercel/Netlify (Serverless)

```bash
cd generated/my-api-1
vercel deploy
```

#### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --prod
COPY . .
RUN pnpm build
EXPOSE 3000
CMD ["pnpm", "start"]
```

#### Traditional VPS

```bash
# Build
pnpm build

# Transfer dist/ + package.json
scp -r dist/ package.json server:/var/www/my-api/

# On server
cd /var/www/my-api
pnpm install --prod
pm2 start dist/src/server.js
```

---

## Monitoring

### CI Status Badge

Add to `README.md`:

```markdown
![CI](https://github.com/your-org/ssot-codegen/workflows/CI/badge.svg)
```

### Test Coverage

```bash
cd packages/gen
pnpm test:coverage

# View coverage report
open coverage/index.html
```

Add coverage badge:
```markdown
![Coverage](https://img.shields.io/codecov/c/github/your-org/ssot-codegen)
```

---

## Troubleshooting CI

### "pnpm command not found"

**Fix:** Ensure pnpm setup step is before Node setup

```yaml
- uses: pnpm/action-setup@v2
  with:
    version: 9
- uses: actions/setup-node@v4
  with:
    node-version: '18'
    cache: 'pnpm'  # This requires pnpm to be installed first
```

### "Module not found" in tests

**Fix:** Build before testing

```yaml
- run: pnpm build
- run: pnpm test
```

### "Permission denied" on scripts

**Fix:** Make scripts executable

```bash
chmod +x scripts/*.sh
git add scripts/
git commit -m "fix: make scripts executable"
```

---

## Best Practices

### 1. Test Before Commit

```bash
# Always run locally before pushing
pnpm check:all
pnpm test:generator
```

### 2. Keep CI Fast

- Use caching aggressively
- Run tests in parallel
- Skip redundant checks

### 3. Clear Failure Messages

```yaml
- name: Type check
  run: pnpm typecheck
  if: always()  # Run even if previous steps fail
```

### 4. Matrix Testing

```yaml
strategy:
  matrix:
    node: [18, 20, 21]
    os: [ubuntu-latest, windows-latest, macos-latest]
```

---

## See Also

- [Contributing Guide](../CONTRIBUTING.md) - How to contribute
- [Project Structure](PROJECT_STRUCTURE.md) - Architecture details
- [CLI Usage](CLI_USAGE.md) - Command reference

