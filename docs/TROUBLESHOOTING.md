# Troubleshooting Guide

Common issues and solutions for SSOT Codegen.

---

## Installation & Setup

### pnpm not found

**Problem:** `pnpm: command not found`

**Solution:**
```bash
npm install -g pnpm
# or
corepack enable
corepack prepare pnpm@latest --activate
```

### Permission Errors on Windows

**Problem:** `EPERM: operation not permitted` when creating directories

**Solutions:**
1. Run terminal as Administrator
2. Check antivirus isn't blocking file operations
3. Ensure directory isn't open in another program
4. Try a different output directory:
   ```bash
   ssot generate minimal --output ./my-output
   ```

---

## Schema & Parsing

### Schema file not found

**Problem:** `Schema file not found: ...`

**Solution:**
```bash
# Use absolute path
ssot generate C:/full/path/to/schema.prisma

# Or relative from project root
ssot generate ./prisma/schema.prisma

# Or use example name
ssot generate minimal
```

### Invalid Prisma Schema

**Problem:** `Schema validation failed`

**Solutions:**
1. Validate schema with Prisma CLI:
   ```bash
   npx prisma validate
   ```

2. Common issues:
   - Missing `generator client` block
   - Invalid field types
   - Circular relations without @relation
   - Missing datasource

**Example valid schema:**
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id    Int    @id @default(autoincrement())
  email String @unique
}
```

---

## Generation Issues

### Out of Memory on Large Schemas

**Problem:** `JavaScript heap out of memory`

**Solutions:**
1. Increase Node.js memory:
   ```bash
   NODE_OPTIONS=--max-old-space-size=4096 pnpm ssot generate large-schema
   ```

2. Reduce write concurrency:
   ```bash
   ssot generate large-schema --concurrency 50
   ```

3. Disable formatting (uses less memory):
   ```bash
   ssot generate large-schema --no-format
   ```

### Generation Hangs / Freezes

**Problem:** Generation stops mid-way without error

**Solutions:**
1. Check system resources (disk space, memory)
2. Reduce concurrency:
   ```bash
   SSOT_WRITE_CONCURRENCY=25 ssot generate your-schema
   ```
3. Run with verbose output to see where it stops
4. Disable formatting if it hangs on that phase

### Files Not Being Generated

**Problem:** Some expected files are missing

**Solutions:**
1. Check the manifest:
   ```bash
   cat generated/your-project-1/src/manifests/generation.json
   ```

2. Verify model is valid (not a junction table):
   - Junction tables (many-to-many intermediates) are skipped

3. Check for errors in console output

4. Validate barrels:
   ```bash
   pnpm validate:barrels
   ```

---

## Generated Project Issues

### Cannot find module '@gen/...'

**Problem:** Import errors in generated code

**Solutions:**
1. Install dependencies:
   ```bash
   cd generated/your-project-1
   pnpm install
   ```

2. Generate Prisma client:
   ```bash
   pnpm exec prisma generate
   ```

3. Build TypeScript:
   ```bash
   pnpm build
   ```

4. Check `tsconfig.json` has path mappings:
   ```json
   {
     "compilerOptions": {
       "paths": {
         "@gen/*": ["./src/gen/*"]
       }
     }
   }
   ```

### Database Connection Failed

**Problem:** `Error: Can't reach database server`

**Solutions:**
1. Create `.env` file:
   ```bash
   cd generated/your-project-1
   cp .env.example .env
   ```

2. Update `DATABASE_URL` in `.env`:
   ```env
   # PostgreSQL
   DATABASE_URL="postgresql://user:password@localhost:5432/mydb"
   
   # MySQL
   DATABASE_URL="mysql://user:password@localhost:3306/mydb"
   
   # SQLite
   DATABASE_URL="file:./dev.db"
   ```

3. Ensure database server is running:
   ```bash
   # PostgreSQL
   pg_ctl status
   
   # MySQL
   mysql.server status
   # or
   systemctl status mysql
   ```

4. Run migrations:
   ```bash
   npx prisma migrate dev
   ```

### Tests Fail Immediately

**Problem:** `pnpm test:validate` fails

**Common causes:**
1. **Database not configured** - See "Database Connection Failed" above
2. **Prisma client not generated**:
   ```bash
   pnpm exec prisma generate
   ```
3. **Dependencies not installed**:
   ```bash
   pnpm install
   ```
4. **Port already in use** - Change PORT in `.env`

---

## Performance Issues

### Slow Generation (30+ seconds)

**Problem:** Generation takes too long

**Solutions:**
1. **Increase concurrency** (for fast SSDs):
   ```bash
   ssot generate your-schema --concurrency 200
   ```

2. **Disable formatting** (saves 10-30% time):
   ```bash
   ssot generate your-schema --no-format
   ```

3. **Use SSD** if on HDD - huge difference!

4. **Close other programs** - free up system resources

### Slow Test Execution

**Problem:** Tests take minutes to run

**Solutions:**
1. Use SQLite for tests (faster than PostgreSQL/MySQL):
   ```env
   DATABASE_URL="file:./test.db"
   ```

2. Reduce test iterations

3. Use in-memory SQLite:
   ```env
   DATABASE_URL="file::memory:?cache=shared"
   ```

---

## Plugin Issues

### Plugin Not Generating Files

**Problem:** Enabled plugin but files missing

**Solutions:**
1. **Check environment variables**:
   ```bash
   echo $ENABLE_GOOGLE_AUTH
   echo $GOOGLE_CLIENT_ID
   ```

2. **Set required env vars**:
   ```bash
   export ENABLE_GOOGLE_AUTH=true
   export GOOGLE_CLIENT_ID="your-id"
   export GOOGLE_CLIENT_SECRET="your-secret"
   ```

3. **Rebuild generator**:
   ```bash
   pnpm build
   ```

4. **Check plugin requirements** in logs

### OAuth/API Keys Not Working

**Problem:** Plugin fails with authentication errors

**Solutions:**
1. **Verify API keys** are valid and active
2. **Check key format** (no extra quotes, spaces, or newlines)
3. **Use dotenv** for complex keys:
   ```bash
   # In .env
   GOOGLE_CLIENT_SECRET="very-long-secret-here"
   ```
4. **Check API quotas** (some services have limits)

---

## Windows-Specific Issues

### CRLF vs LF Line Endings

**Problem:** Git warnings about line endings

**Solution:** Configure Git:
```bash
git config --global core.autocrlf true
```

### Path Too Long

**Problem:** `ENAMETOOLONG` error

**Solutions:**
1. Use shorter output directory names
2. Enable long paths in Windows:
   ```powershell
   # Run as Administrator
   New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force
   ```

3. Use shorter project names:
   ```bash
   ssot generate minimal --name api
   ```

### PowerShell Execution Policy

**Problem:** Cannot run scripts

**Solution:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

## macOS-Specific Issues

### Command Not Found After pnpm install

**Problem:** `ssot: command not found`

**Solutions:**
1. Add pnpm global bin to PATH:
   ```bash
   echo 'export PATH="$HOME/.local/share/pnpm:$PATH"' >> ~/.zshrc
   source ~/.zshrc
   ```

2. Or use pnpm exec:
   ```bash
   pnpm exec ssot generate minimal
   ```

---

## CI/CD Issues

### CI Times Out

**Problem:** GitHub Actions / CI times out during generation

**Solutions:**
1. Reduce concurrency:
   ```yaml
   - run: SSOT_WRITE_CONCURRENCY=50 pnpm ssot generate minimal
   ```

2. Disable formatting in CI:
   ```yaml
   - run: SSOT_FORMAT_CODE=false pnpm ssot generate minimal
   ```

3. Use caching:
   ```yaml
   - uses: actions/cache@v3
     with:
       path: ~/.pnpm-store
       key: ${{ runner.os }}-pnpm-${{ hashFiles('**/pnpm-lock.yaml') }}
   ```

### Disk Space Issues

**Problem:** No space left on device

**Solutions:**
1. Clean up before generation:
   ```bash
   pnpm clean
   rm -rf generated/*
   ```

2. Use `--no-standalone` to reduce output:
   ```bash
   ssot generate minimal --no-standalone --output ./gen
   ```

---

## Getting Help

If none of the above solutions work:

1. **Check existing issues**: [GitHub Issues](https://github.com/your-org/ssot-codegen/issues)
2. **Enable debug logging**: Set `LOG_LEVEL=debug` in your environment
3. **Create minimal reproduction**:
   ```bash
   ssot generate minimal
   # Does minimal example work?
   ```
4. **Open an issue** with:
   - SSOT Codegen version
   - Node.js version (`node --version`)
   - Operating system
   - Full error message
   - Steps to reproduce

---

## Common Error Messages

### "EMFILE: too many open files"

**Cause:** System file descriptor limit reached

**Solution:**
```bash
# macOS/Linux
ulimit -n 4096

# Or reduce concurrency
ssot generate your-schema --concurrency 50
```

### "ENOSPC: no space left on device"

**Cause:** Disk is full

**Solution:**
```bash
# Check disk space
df -h

# Clean up
pnpm clean
rm -rf node_modules generated
```

### "Cannot find package 'prettier'"

**Cause:** Dev dependency missing (when using `--format`)

**Solution:**
```bash
cd packages/gen
pnpm install
pnpm build
```

### "Port 3000 is already in use"

**Cause:** Another process using port 3000

**Solution:**
```bash
# Option 1: Kill process on port 3000
# macOS/Linux
lsof -ti:3000 | xargs kill

# Option 2: Use different port
PORT=3001 pnpm dev
```

---

## Still Need Help?

- 📚 [Documentation](../README.md)
- 💬 [Discussions](https://github.com/your-org/ssot-codegen/discussions)
- 🐛 [Report a Bug](https://github.com/your-org/ssot-codegen/issues/new)
- 📧 Contact: support@your-org.com

