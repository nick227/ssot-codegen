# Database Configuration Guide

**Problem Solved:** Multiple examples need separate databases with flexible configuration.

---

## 🎯 The Challenge

When running multiple examples (demo, blog, ecommerce), each needs its own database:
- `ssot_demo` for demo-example
- `ssot_blog` for blog-example
- `ssot_ecommerce` for ecommerce-example

**Previous Issue:** Single `DATABASE_URL` pointed to one database.

**Solution:** Flexible configuration supporting both full URLs and component-based setup with auto-database creation.

---

## ✅ Solution Implemented

### **1. Dual Configuration Modes**

#### **Option A: Full DATABASE_URL** (Production Recommended)
```env
DATABASE_URL="mysql://root@localhost:3306/ssot_demo"
DATABASE_URL="postgresql://user:pass@localhost:5432/ssot_blog"
```

#### **Option B: Component-Based** (Development Recommended)
```env
DB_PROVIDER="mysql"          # or postgresql, sqlite
DB_HOST="localhost"
DB_PORT="3306"              # 3306 for MySQL, 5432 for PostgreSQL
DB_USER="root"              # or postgres for PostgreSQL
DB_PASSWORD=""              # Empty for root with no password
DB_NAME="ssot_demo"         # Auto-created if doesn't exist!
```

### **2. Automatic Database Creation**

Database is automatically created if it doesn't exist!

```bash
# Run database setup
npm run db:setup

# Or combined setup + migration
npm run db:init
```

### **3. Example-Specific Databases**

Each example has its own database name:

| Example | Port | Database Name |
|---------|------|---------------|
| demo-example | 3000 | `ssot_demo` |
| blog-example | 3001 | `ssot_blog` |
| ecommerce-example | 3002 | `ssot_ecommerce` |

---

## 🚀 Quick Start

### **For Local Development (Easy Mode)**

**1. Default Configuration** (MySQL, root, no password):
```bash
# Create .env from example
cp .env.example .env

# Setup database (auto-creates if needed)
npm run db:init

# Start development
npm run dev
```

**That's it!** Database `ssot_demo` is automatically created.

---

### **For Custom Credentials**

**1. With Password:**
```env
DB_PROVIDER="mysql"
DB_HOST="localhost"
DB_PORT="3306"
DB_USER="myuser"
DB_PASSWORD="mypassword"
DB_NAME="ssot_demo"
```

**2. PostgreSQL:**
```env
DB_PROVIDER="postgresql"
DB_HOST="localhost"
DB_PORT="5432"
DB_USER="postgres"
DB_PASSWORD="postgres"
DB_NAME="ssot_demo"
```

**3. SQLite (No Server Required):**
```env
DB_PROVIDER="sqlite"
DB_NAME="dev"                # Creates ./dev.db
```

---

## 📚 Running Multiple Examples

### **Demo Example** (Port 3000):
```bash
cd examples/demo-example
cp .env.example .env
# Edit DB_NAME="ssot_demo"
npm run db:init
npm run dev
```

### **Blog Example** (Port 3001):
```bash
cd examples/blog-example
cp .env.example .env
# Edit DB_NAME="ssot_blog", PORT=3001
npm run db:init
npm run dev
```

### **E-commerce Example** (Port 3002):
```bash
cd examples/ecommerce-example
cp .env.example .env
# Edit DB_NAME="ssot_ecommerce", PORT=3002
npm run db:init
npm run dev
```

**All three run simultaneously on different ports with separate databases!**

---

## 🛠️ Database Setup Script

### **What It Does:**

1. Reads configuration from `.env`
2. Checks if database exists
3. Creates database if missing
4. Shows generated `DATABASE_URL` (optional to add to .env)
5. Validates connection

### **Usage:**

```bash
# Standalone setup
npm run db:setup

# Combined: setup + push schema
npm run db:init

# Or manually
node scripts/db-setup.js
```

### **Output Example:**
```
🔧 Database Setup Starting...

📊 Using component-based database configuration
   Provider: mysql
   Database: ssot_demo

🔍 Checking if database exists: ssot_demo
✅ Created MySQL database: ssot_demo

✅ Database setup complete!

📝 Add this to your .env file:
DATABASE_URL="mysql://root@localhost:3306/ssot_demo"

Or keep using component-based configuration.
```

---

## 🔧 Technical Details

### **Supported Databases:**

| Provider | Default Port | Default User | Auto-Creation |
|----------|--------------|--------------|---------------|
| MySQL | 3306 | root | ✅ Yes |
| PostgreSQL | 5432 | postgres | ✅ Yes |
| SQLite | N/A | N/A | ✅ Automatic |

### **Connection Logic:**

1. **Check `DATABASE_URL`** - Use if present
2. **Build from components** - Use `DB_*` variables
3. **Apply defaults**:
   - Host: `localhost`
   - Port: 3306 (MySQL) or 5432 (PostgreSQL)
   - User: `root` (MySQL) or `postgres` (PostgreSQL)
   - Password: Empty string

### **Database Creation:**

**MySQL:**
```sql
CREATE DATABASE IF NOT EXISTS `ssot_demo`
```

**PostgreSQL:**
```sql
CREATE DATABASE "ssot_demo"
```

**SQLite:**
- File created automatically by Prisma

---

## 📝 Environment Variable Reference

### **Database Connection:**
```env
# Full URL (highest priority)
DATABASE_URL="provider://user:pass@host:port/database"

# Component-based (fallback)
DB_PROVIDER="mysql"         # mysql, postgresql, sqlite
DB_HOST="localhost"         # Database server host
DB_PORT="3306"              # Server port
DB_USER="root"              # Database user
DB_PASSWORD=""              # User password (empty for no password)
DB_NAME="ssot_demo"         # Database name (auto-created!)

# Advanced (optional)
DB_POOL_MIN=2               # Connection pool minimum
DB_POOL_MAX=10              # Connection pool maximum
DB_CONNECTION_TIMEOUT=5000  # Timeout in milliseconds
DB_SSL=false                # Enable SSL connection
```

### **Server Configuration:**
```env
PORT=3000                   # Server port (3000, 3001, 3002 for examples)
NODE_ENV=development        # development, production, test
API_PREFIX=/api             # API route prefix
CORS_ORIGIN=http://localhost:3000  # CORS allowed origin
LOG_LEVEL=debug             # trace, debug, info, warn, error
```

### **Authentication:**
```env
JWT_SECRET="your-secret"    # JWT signing secret (CHANGE IN PRODUCTION!)
JWT_EXPIRES_IN="7d"         # Access token expiry
JWT_REFRESH_EXPIRES_IN="30d"  # Refresh token expiry
```

---

## 🐛 Troubleshooting

### **Issue: "Access denied for user 'root'@'localhost'"**

**Solution 1:** Check MySQL is running
```bash
# macOS
brew services start mysql

# Linux
sudo systemctl start mysql

# Windows (as Admin)
net start MySQL
```

**Solution 2:** Set password
```bash
# Login to MySQL
mysql -u root

# Set password
ALTER USER 'root'@'localhost' IDENTIFIED BY 'your-password';

# Update .env
DB_PASSWORD="your-password"
```

---

### **Issue: "Database does not exist" (PostgreSQL)**

**Solution:** Ensure PostgreSQL service is running and user has CREATE DATABASE permission
```bash
# Check PostgreSQL status
pg_isready

# Login and check permissions
psql -U postgres

# Grant permissions
ALTER USER postgres CREATEDB;
```

---

### **Issue: "Connection refused" or "Can't connect"**

**Check:**
1. Database server is running
2. Port is correct (3306 for MySQL, 5432 for PostgreSQL)
3. Host is correct (usually `localhost` or `127.0.0.1`)
4. Firewall allows connection

```bash
# Test MySQL connection
mysql -h localhost -u root -p

# Test PostgreSQL connection
psql -h localhost -U postgres
```

---

### **Issue: Multiple examples conflict**

**Solution:** Each example needs unique:
1. **Port** - `PORT=3000`, `PORT=3001`, `PORT=3002`
2. **Database** - `DB_NAME=ssot_demo`, `DB_NAME=ssot_blog`, etc.

Example `.env` files already configured with different ports/databases!

---

## 🎯 Best Practices

### **Development:**
✅ Use component-based configuration (`DB_*` variables)  
✅ Use default credentials (root/no password) for simplicity  
✅ Use SQLite for quick prototyping  
✅ Different database per example  
✅ Different port per example  

### **Staging:**
✅ Use full `DATABASE_URL`  
✅ Set strong passwords  
✅ Use environment-specific databases  
✅ Enable SSL for database connections  

### **Production:**
✅ Use managed database services (AWS RDS, Azure Database, Google Cloud SQL)  
✅ Use connection pooling  
✅ Enable SSL  
✅ Use secrets management (AWS Secrets Manager, Azure Key Vault)  
✅ Use `DATABASE_URL` from environment  
✅ Never commit `.env` files  

---

## 📊 Migration from Old Config

### **Old Way** (Single DATABASE_URL):
```env
DATABASE_URL="mysql://root@localhost:3306/mydb"
```

**Problem:** All examples use same database

### **New Way** (Flexible per-example):

**Demo:**
```env
DB_NAME="ssot_demo"
PORT=3000
```

**Blog:**
```env
DB_NAME="ssot_blog"
PORT=3001
```

**E-commerce:**
```env
DB_NAME="ssot_ecommerce"
PORT=3002
```

**Solution:** Each example has isolated database!

---

## 🔐 Security Considerations

### **Development:**
- ✅ Empty passwords OK for local MySQL/PostgreSQL
- ✅ `root` user acceptable
- ✅ Local connections only

### **Production:**
- ❌ Never use empty passwords
- ❌ Never use `root` user
- ❌ Never expose database publicly
- ✅ Use strong passwords (32+ characters)
- ✅ Use dedicated database users
- ✅ Use SSL/TLS connections
- ✅ Use secrets management
- ✅ Use read-only users for read operations

---

## ✨ Summary

### **What's New:**

1. **Dual Configuration** - URL or components
2. **Auto-Database Creation** - No manual setup needed
3. **Example Isolation** - Each example has own database
4. **Flexible Credentials** - Defaults to root/no password, customizable
5. **Multi-Database Support** - MySQL, PostgreSQL, SQLite
6. **Setup Scripts** - `npm run db:setup` or `npm run db:init`

### **Quick Start:**
```bash
# 1. Copy env
cp .env.example .env

# 2. Setup database (auto-creates!)
npm run db:init

# 3. Start development
npm run dev

# That's it! 🎉
```

### **For Multiple Examples:**
Each example has `.env.example` with:
- ✅ Unique `DB_NAME`
- ✅ Unique `PORT`
- ✅ Auto-creation support

**Run all three examples simultaneously without conflicts!**

---

**Database configuration is now flexible, automatic, and developer-friendly!** 🚀

