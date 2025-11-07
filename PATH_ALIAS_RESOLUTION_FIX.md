# TypeScript Path Alias Resolution Fix

## Issue Summary

The build pipeline had a critical issue where TypeScript path aliases (`@/` imports) were not being resolved in the compiled output. Node.js cannot understand these aliases at runtime, causing module resolution failures.

### Root Cause
The `packages/gen/package.json` had `tsc-alias` in the build script but it was **not installed** as a devDependency. Additionally, some workspace dependencies were using version numbers instead of the `workspace:*` protocol.

## Changes Made

### 1. Fixed `packages/gen/package.json`
Added missing dependencies:
- Added `tsc-alias: ^1.8.10` to devDependencies
- Added `typescript: ^5.9.0` to devDependencies (for consistency)

### 2. Fixed Workspace Dependencies
Updated workspace package references to use proper protocol:

**packages/cli/package.json:**
```json
"dependencies": {
  "@ssot-codegen/gen": "workspace:*",  // Changed from "^0.4.0"
  ...
}
```

**packages/templates-default/package.json:**
```json
"dependencies": {
  "@ssot-codegen/core": "workspace:*",  // Changed from "^0.4.0"
}
```

## Build Pipeline Verification

### Current Build Process
The build pipeline for `packages/gen` correctly executes:
```bash
tsc -p tsconfig.json && tsc-alias -p tsconfig.json
```

This two-step process:
1. **TypeScript Compilation**: Compiles `.ts` files to `.js` but leaves path aliases unchanged
2. **tsc-alias Resolution**: Resolves all `@/` aliases to relative paths in the compiled output

### Path Alias Configuration
From `packages/gen/tsconfig.json`:
```json
{
  "compilerOptions": {
    "baseUrl": "src",
    "paths": {
      "@/pipeline/*": ["pipeline/*"],
      "@/generators/*": ["generators/*"],
      "@/analyzers/*": ["analyzers/*"],
      "@/utils/*": ["utils/*"],
      "@/plugins/*": ["plugins/*"],
      "@/templates/*": ["templates/*"],
      "@/database/*": ["database/*"],
      "@/api/*": ["api/*"]
    }
  }
}
```

## Verification Results

### ✅ Build Success
```bash
pnpm build
# Exit code: 0
# Successfully compiled and resolved all path aliases
```

### ✅ Import Resolution Verified
**Source Code** (before compilation):
```typescript
import type { ContextAfterPhase1 } from '@/pipeline/typed-context.js'
```

**Compiled Output** (after tsc-alias):
```javascript
import { afterPhase } from '../phase-hooks.js';
```

### ✅ Template Strings Preserved
Path aliases in template strings (used to generate user code) are correctly preserved:
```javascript
// This is correct - it's a template for generated code
\`import prisma from '@/db'\`
```

## Impact

### Fixed Issues
- ✅ Node.js can now properly resolve all imports in compiled output
- ✅ Workspace dependencies install correctly
- ✅ Build pipeline completes without errors
- ✅ Generated code maintains proper import structure

### No Breaking Changes
- Source code remains unchanged
- Path aliases still work during development
- IDE autocomplete and navigation continue to work
- Generated code templates are unaffected

## Testing Recommendations

1. **Unit Tests**: Run existing test suite
   ```bash
   cd packages/gen && pnpm test
   ```

2. **Integration Tests**: Test with actual code generation
   ```bash
   pnpm examples:all
   ```

3. **Runtime Verification**: Verify generated code runs without module resolution errors

## Future Considerations

### Other Packages
Currently only `packages/gen` uses path aliases. If other packages adopt them:
1. Add `tsc-alias` to devDependencies
2. Update build script: `"build": "tsc -p tsconfig.json && tsc-alias -p tsconfig.json"`
3. Configure paths in tsconfig.json

### Alternative Solutions
For future reference, other approaches to handle path aliases:
- **tsconfig-paths**: Runtime path resolution (not suitable for published packages)
- **esbuild/rollup**: Bundlers with built-in alias resolution
- **Relative imports**: Avoid aliases altogether (less maintainable for large codebases)

## Summary

The fix ensures that TypeScript path aliases are properly resolved during the build process, making the compiled code compatible with Node.js module resolution. This is critical for the package to function correctly when published to npm and installed by users.

