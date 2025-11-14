# MySQL Storage Engine Fix - MyISAM vs InnoDB

## Problem

**Error:** `Specified key was too long; max key length is 1000 bytes`

**Root Cause:**
1. MySQL is using **MyISAM** storage engine (1000-byte key length limit)
2. Prisma **ignores** `@db.VarChar(191)` when creating `@unique` indexes
3. Prisma creates **VARCHAR(255)** indexes even when column is `@db.VarChar(191)`
4. VARCHAR(255) × 4 bytes (utf8mb4) = **1020 bytes** > 1000 bytes ❌

## Solution

**Switch MySQL to InnoDB** (supports up to 3072 bytes)

### Option 1: Configure MySQL Default Storage Engine

Edit MySQL configuration file (`my.ini` for Windows, `my.cnf` for Linux):

```ini
[mysqld]
default-storage-engine=InnoDB
```

Then restart MySQL service.

### Option 2: Set Per-Session (Temporary)

```sql
SET default_storage_engine = 'InnoDB';
```

### Option 3: Create Tables with InnoDB Explicitly

Prisma doesn't support specifying storage engine in schema, but you can:

1. Let Prisma create the schema
2. Manually alter tables to use InnoDB:
```sql
ALTER TABLE User ENGINE=InnoDB;
ALTER TABLE Post ENGINE=InnoDB;
-- etc.
```

### Option 4: Use Raw SQL Migrations

Create a migration file that sets storage engine:

```sql
-- In your migration file
SET default_storage_engine = 'InnoDB';
```

## Verification

Check current storage engine:
```sql
SHOW VARIABLES LIKE 'default_storage_engine';
```

Check table storage engines:
```sql
SELECT TABLE_NAME, ENGINE 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = 'your_database';
```

## Why InnoDB?

- **MyISAM**: 1000-byte key length limit
- **InnoDB**: 
  - Default: 767 bytes
  - With `innodb_large_prefix`: Up to 3072 bytes (MySQL 5.7.7+)
  - MySQL 8.0+: `innodb_large_prefix` is enabled by default

## Prisma Limitation

**Prisma does NOT respect `@db.VarChar(191)` for `@unique` indexes.**

Even with:
```prisma
email String @unique @db.VarChar(191)
```

Prisma creates a VARCHAR(255) unique index, which exceeds MyISAM's 1000-byte limit.

**Workaround:** Use InnoDB storage engine, which supports larger indexes.

## Testing

After switching to InnoDB:
```bash
cd generated/Blog\ Website-[number]
pnpm db:push
```

Should now succeed! ✅

## InnoDB Optimizations

Now that you're using InnoDB, you can take advantage of:

1. **Larger Indexes**: Up to 3072 bytes (vs MyISAM's 1000 bytes)
2. **Foreign Key Constraints**: Full support for referential integrity
3. **Transactions**: ACID compliance for data integrity
4. **Row-Level Locking**: Better concurrency than MyISAM's table-level locking
5. **Crash Recovery**: Automatic recovery from crashes

### Recommended InnoDB Settings

Your `my.ini` already has good InnoDB settings:
- `innodb_file_per_table=1` ✅ (each table has its own file)
- `innodb_default_row_format=dynamic` ✅ (supports large indexes)
- `innodb_buffer_pool_size=256M` ✅ (adjust based on available RAM)

### Optional: Increase Buffer Pool Size

For better performance, consider increasing `innodb_buffer_pool_size`:
```ini
# Use 50-70% of available RAM
innodb_buffer_pool_size=512M  # or higher if you have more RAM
```

