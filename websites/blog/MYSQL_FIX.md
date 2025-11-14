# MySQL Index Key Length Fix

## Problem

MySQL with `utf8mb4` character set (4 bytes per character) has a limit on index key length:
- Default limit: 767 bytes (older MySQL) or 1000 bytes (newer MySQL)
- `VARCHAR(255)` with utf8mb4 = 255 × 4 = 1020 bytes ❌ Exceeds limit

## Solution Applied

1. **Limited String field lengths** to 191 characters for indexed fields:
   - `slug String @db.VarChar(191)` → 191 × 4 = 764 bytes ✅ Safe
   - `email String @db.VarChar(191)` → 764 bytes ✅ Safe

2. **Removed duplicate indexes**:
   - `@unique` already creates an index, so `@@index([slug])` was redundant
   - Removed `@@index([email])` since `@unique` already indexes it

## Changes Made

- `Post.slug`: Added `@db.VarChar(191)`, removed duplicate `@@index([slug])`
- `Category.slug`: Added `@db.VarChar(191)`
- `Tag.name`: Added `@db.VarChar(191)`
- `Tag.slug`: Added `@db.VarChar(191)`
- `User.email`: Added `@db.VarChar(191)`, removed duplicate `@@index([email])`

## Why 191?

- 191 × 4 bytes (utf8mb4) = 764 bytes
- Well under the 767/1000 byte limit
- Leaves room for growth if MySQL settings change
- Standard practice for MySQL indexes with utf8mb4

## Alternative Solutions

If you need longer fields:

1. **Use prefix indexes** (MySQL 5.7+):
   ```prisma
   @@index([slug(length: 100)]) // Only index first 100 chars
   ```

2. **Increase MySQL key length**:
   ```sql
   SET GLOBAL innodb_large_prefix = ON;
   SET GLOBAL innodb_file_format = Barracuda;
   ```

3. **Use PostgreSQL** instead (no such limit)

## Testing

After applying this fix:
```bash
cd generated/Blog\ Website-[number]
pnpm db:push
```

Should now succeed! ✅

## Important: MySQL Storage Engine

**Prisma requires InnoDB** (not MyISAM) for proper index support.

- **MyISAM**: 1000-byte key length limit ❌
- **InnoDB**: Up to 3072 bytes ✅

Ensure MySQL is configured with:
```ini
default_storage_engine=InnoDB
```

See `docs/MYSQL_STORAGE_ENGINE_FIX.md` for full details.

