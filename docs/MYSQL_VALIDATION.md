# MySQL Key Length Validation

## Overview

Schema validation now includes **MySQL-specific checks** to catch index key length issues **before** running the pipeline.

## Problem

MySQL with `utf8mb4` character set (4 bytes per character) has index key length limits:
- **Default limit**: 767 bytes (older MySQL) or 1000 bytes (newer MySQL)
- **VARCHAR(255)** with utf8mb4 = 255 × 4 = **1020 bytes** ❌ Exceeds limit
- **VARCHAR(191)** with utf8mb4 = 191 × 4 = **764 bytes** ✅ Safe

## Solution

### 1. Schema Validation (Pre-Pipeline)

The validator now checks for:
- ✅ String fields with `@unique` (creates index)
- ✅ String fields in `@@index` (creates index)
- ✅ Missing `@db.VarChar(length)` constraint on indexed String fields
- ✅ Fields with explicit length that exceeds MySQL limit

**Error Example:**
```
Model Post.slug is indexed (@unique or @@index) but has no explicit length constraint. 
With MySQL utf8mb4, VARCHAR(255) = 1020 bytes exceeds the 767 byte limit. 
Fix: Add @db.VarChar(191) to limit length: slug String @unique @db.VarChar(191)
```

### 2. When Validation Runs

Validation runs in **Phase 2** (`validateSchema`) **before** code generation:
- ✅ Catches issues early
- ✅ Provides clear fix suggestions
- ✅ Prevents wasted generation time

### 3. Fix Applied

The Blog schema was fixed:
```prisma
// BEFORE (would fail)
slug String @unique

// AFTER (passes validation)
slug String @unique @db.VarChar(191)
```

## MySQL PATH Issue

### Problem

The `mysql` command is not in PATH, causing database setup scripts to fail:
```
'mysql' is not recognized as an internal or external command
```

### Solution

**Option 1: Add MySQL to PATH**
```powershell
# Add to PATH permanently (PowerShell)
[Environment]::SetEnvironmentVariable("Path", $env:Path + ";C:\wamp64\bin\mysql\mysql8.3.0\bin", "User")
```

**Option 2: Use Full Path**
```powershell
# In generated projects, use full path
C:\wamp64\bin\mysql\mysql8.3.0\bin\mysql.exe -u root -e "CREATE DATABASE test_db;"
```

**Option 3: Use WAMP MySQL Service**
```powershell
# WAMP provides MySQL service - use Prisma directly
pnpm db:push  # Prisma handles connection via DATABASE_URL
```

### Current MySQL Location

Found at: `C:\wamp64\bin\mysql\mysql8.3.0\bin\mysql.exe`

## Testing

### Test Validation

```bash
# Generate Blog project (should catch MySQL issues)
pnpm ssot bulk --config websites/config/bulk-generate.json
```

### Expected Behavior

**Before Fix:**
```
❌ Schema validation failed:
Model Post.slug is indexed but has no explicit length constraint...
```

**After Fix:**
```
✅ Schema validation passed
✅ Database setup successful
```

## Best Practices

1. **Always specify length** for indexed String fields in MySQL:
   ```prisma
   slug String @unique @db.VarChar(191)
   email String @unique @db.VarChar(191)
   ```

2. **Use 191 as default** for MySQL indexes (safe for utf8mb4)

3. **Check validation errors** before running full pipeline

4. **Consider PostgreSQL** if you need longer indexed strings (no such limit)

## Related Files

- `packages/gen/src/dmmf-parser/validation/mysql-key-length.ts` - Validation logic
- `packages/gen/src/pipeline/phases/02-validate-schema.phase.typed.ts` - Integration
- `websites/blog/schema.prisma` - Fixed schema example

