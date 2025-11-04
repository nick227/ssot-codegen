# CLI Feedback Improvements Proposal

## Overview

Enhanced CLI feedback system with multiple verbosity levels, colorized output, progress tracking, and performance metrics.

## Current vs Proposed

### Current Output (Minimal)
```
[ssot-codegen] Starting code generation...
[ssot-codegen] Parsed 7 models, 1 enums
[ssot-codegen] ✅ Generated 71 working code files
```

### Proposed Output (Normal Mode)
```
╭─────────────────────────────────────────────╮
│   🚀 SSOT Code Generator                    │
╰─────────────────────────────────────────────╯

📊 Schema Analysis
   ├─ 7 models
   ├─ 1 enums
   └─ 24 relationships

▸ Generating code for 7 models...
⚠ Junction table detected: PostCategory - generating DTOs/validators only
⚠ Junction table detected: PostTag - generating DTOs/validators only

📁 Generated Files
   ├─ DTOs            28 ███████░░░
   ├─ Validators      21 ██████░░░░
   ├─ Services         5 ██░░░░░░░░
   ├─ Controllers      5 ██░░░░░░░░
   ├─ Routes           5 ██░░░░░░░░
   └─ Base/Infra       7 ███░░░░░░░

╭─────────────────────────────────────────────╮
│   ✅ Generation Complete                    │
╰─────────────────────────────────────────────╯

📈 Summary
   ├─ Files generated: 71
   ├─ Models processed: 7
   ├─ Total time: 1.23s
   ├─ Warnings: 2
   └─ Performance: 58 files/sec
```

### Proposed Output (Verbose Mode)
```
╭─────────────────────────────────────────────╮
│   🚀 SSOT Code Generator                    │
╰─────────────────────────────────────────────╯

📊 Schema Analysis
   ├─ 7 models
   ├─ 1 enums
   └─ 24 relationships

⏳ Parsing schema...
✓ Parsing schema (12ms)

⏳ Generating DTOs...
  📦 Generating Author...
  ✓ Author (4 files, 45ms)
  📦 Generating Post...
  ✓ Post (4 files, 52ms)
  📦 Generating Comment...
  ✓ Comment (4 files, 48ms)
  📦 Generating Category...
  ✓ Category (4 files, 43ms)
  📦 Generating Tag...
  ✓ Tag (4 files, 41ms)
  📦 Generating PostCategory...
  ⚠ Junction table detected: PostCategory - generating DTOs/validators only
  ✓ PostCategory (4 files, 38ms)
  📦 Generating PostTag...
  ⚠ Junction table detected: PostTag - generating DTOs/validators only
  ✓ PostTag (4 files, 39ms)
✓ Generating DTOs (28 files) 310ms

⏳ Generating Services...
✓ Generating Services (5 files) 89ms

⏳ Generating Controllers...
✓ Generating Controllers (5 files) 76ms

⏳ Generating Routes...
✓ Generating Routes (5 files) 52ms

⏳ Writing base infrastructure...
✓ Writing base infrastructure (7 files) 34ms

⏳ Generating barrels...
✓ Generating barrels 41ms

⏳ Generating OpenAPI...
✓ Generating OpenAPI 28ms

╭─────────────────────────────────────────────╮
│   ✅ Generation Complete                    │
╰─────────────────────────────────────────────╯

📈 Summary
   ├─ Files generated: 71
   ├─ Models processed: 7
   ├─ Total time: 1.23s
   ├─ Warnings: 2
   └─ Avg: 58 files/sec

⏱  Phase Breakdown
   ├─ Generating DTOs            310ms (25.2%)
   ├─ Generating Services         89ms  (7.2%)
   ├─ Generating Controllers      76ms  (6.2%)
   ├─ Generating Routes           52ms  (4.2%)
   ├─ Generating barrels          41ms  (3.3%)
   ├─ Writing base infrastructure 34ms  (2.8%)
   ├─ Generating OpenAPI          28ms  (2.3%)
   └─ Parsing schema              12ms  (1.0%)
```

## Verbosity Levels

### 1. Silent (`--silent`)
No output except errors. Useful for CI/CD pipelines.

### 2. Minimal (`--minimal`)
```
Generating...
✓ Generated 71 files in 1.23s
```

### 3. Normal (default)
Nice formatted output with summary table and warnings.

### 4. Verbose (`--verbose`)
Per-model progress, phase timing, detailed breakdown.

### 5. Debug (`--debug`)
Everything from verbose plus:
- File-level details
- Internal state dumps
- Stack traces for warnings
- Generator selection logic

## Features

### 1. **Colorized Output**
- ✅ Green for success
- ⚠️  Yellow for warnings
- ✗ Red for errors
- 🔵 Blue for in-progress
- 🔍 Gray for debug info

Can be disabled with `--no-color` or when CI detected.

### 2. **Progress Tracking**
- Phase-level progress (parsing, generating, writing)
- Model-level progress (per model timing)
- File count per layer

### 3. **Performance Metrics**
- Total generation time
- Files per second
- Phase breakdown with percentages
- Individual model timing

### 4. **Smart Warnings**
- Junction table detection
- Missing relationships
- Large model warnings (>20 fields)
- Deprecated field types

### 5. **Error Context**
Better error messages with:
- Which model/file failed
- Line numbers if applicable
- Suggestions for fixes
- Stack traces in debug mode

## Usage Examples

### CLI Flags
```bash
# Default (normal mode)
npm run generate

# Quiet mode (only errors)
npm run generate -- --silent

# Minimal output
npm run generate -- --minimal

# Verbose output
npm run generate -- --verbose

# Debug mode
npm run generate -- --debug

# Disable colors
npm run generate -- --no-color

# Enable timestamps
npm run generate -- --timestamps
```

### Programmatic Usage
```typescript
import { generateFromSchema } from '@ssot-codegen/gen'
import { createLogger } from '@ssot-codegen/gen/utils/cli-logger'

const logger = createLogger({
  level: 'verbose',
  useColors: true,
  showTimestamps: false
})

await generateFromSchema({
  schemaPath: './prisma/schema.prisma',
  output: './gen',
  logger  // Pass logger to generator
})
```

## Implementation Checklist

- [x] Create `CLILogger` class with verbosity levels
- [ ] Update `generateFromSchema()` to use logger
- [ ] Add CLI flags parsing (--verbose, --silent, --no-color)
- [ ] Track file counts per layer (DTOs, Services, etc.)
- [ ] Add phase timing
- [ ] Add model-level progress tracking
- [ ] Detect junction tables and log warnings
- [ ] Add CI detection for auto-disabling colors
- [ ] Add progress bars for large schemas (>50 models)
- [ ] Export logger for custom scripts

## Benefits

1. **Better DX** - Developers see what's happening
2. **Debugging** - Easy to identify slow phases
3. **Confidence** - Visual confirmation of success
4. **Professional** - Polished CLI experience
5. **Flexible** - Multiple verbosity levels
6. **Performance** - Identify optimization opportunities

## Migration

The logger is backward compatible. Existing code will work unchanged:
- Old: `console.log('[ssot-codegen] ...')`
- New: `logger.logProgress('...')` (with graceful fallback)

## Example Integration

```typescript
// In index-new.ts
export async function generateFromSchema(config: GeneratorConfig) {
  const logger = createLogger({
    level: config.verbosity || 'normal',
    useColors: config.colors ?? !isCI(),
    showTimestamps: config.timestamps ?? false
  })
  
  logger.startGeneration()
  
  // Parse schema
  logger.startPhase('Parsing schema')
  const parsedSchema = parseDMMF(dmmf)
  logger.endPhase('Parsing schema')
  
  // Count relationships
  const relationCount = parsedSchema.models.reduce(
    (sum, m) => sum + m.relationFields.length, 0
  )
  
  logger.logSchemaParsed(
    parsedSchema.models.length,
    parsedSchema.enums.length,
    relationCount
  )
  
  // Generate code per model
  logger.startPhase('Generating code')
  for (const model of parsedSchema.models) {
    logger.startModel(model.name)
    
    const files = generateModelCode(model)
    
    // Check for junction tables
    if (isJunctionTable(model)) {
      logger.logJunctionTable(model.name)
    }
    
    logger.completeModel(model.name, files.length)
  }
  logger.endPhase('Generating code', totalFiles)
  
  // Summary
  const breakdown = [
    { layer: 'DTOs', count: dtoCount },
    { layer: 'Validators', count: validatorCount },
    { layer: 'Services', count: serviceCount },
    { layer: 'Controllers', count: controllerCount },
    { layer: 'Routes', count: routeCount },
    { layer: 'Base/Infra', count: baseCount }
  ]
  
  logger.printGenerationTable(breakdown)
  logger.completeGeneration(totalFiles)
}
```

## Future Enhancements

1. **Spinner animations** for long operations
2. **Progress bars** for large schemas
3. **Interactive mode** - prompt for options
4. **Live reload** - watch mode with feedback
5. **Stats export** - JSON output for CI tools
6. **HTML report** - generate HTML summary
7. **Comparison mode** - show diff from last run

