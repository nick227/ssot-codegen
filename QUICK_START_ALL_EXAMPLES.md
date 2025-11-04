# Quick Start - All Examples

**Status:** ✅ **ZERO CONFIG NEEDED!**  
**Setup Time:** 30 seconds per example  
**Configuration:** Already done!

---

## 🎉 What's Ready Out of the Box

All 4 examples have **real `.env` files** with working defaults:

| Example | Database | Port | Status |
|---------|----------|------|--------|
| 📝 Demo | `ssot_demo` | 3000 | ✅ Ready |
| 📰 Blog | `ssot_blog` | 3001 | ✅ Ready |
| 🛒 E-commerce | `ssot_ecommerce` | 3002 | ✅ Ready |
| ⚡ Minimal | `ssot_minimal` | 3003 | ✅ Ready |

**All use:** `root` user with no password (exactly as requested!)

---

## 🚀 Run Any Example (30 seconds)

### **Demo Example:**
```bash
cd examples/demo-example
npm install
npm run db:init    # Auto-creates ssot_demo database
npm run dev        # Server on http://localhost:3000
```

### **Blog Example:**
```bash
cd examples/blog-example
npm install
npm run db:init    # Auto-creates ssot_blog database
npm run dev        # Server on http://localhost:3001
```

### **E-commerce Example:**
```bash
cd examples/ecommerce-example
npm install
npm run db:init    # Auto-creates ssot_ecommerce database
npm run dev        # Server on http://localhost:3002
```

### **Minimal Example:**
```bash
cd examples/minimal
npm install
npm run db:init    # Auto-creates ssot_minimal database
npm run dev        # Server on http://localhost:3003
```

---

## 🎨 Run ALL Examples Simultaneously

### **Terminal 1 - Demo:**
```bash
cd examples/demo-example
npm run db:init && npm run dev
# ✅ Database: ssot_demo
# ✅ Port: 3000
```

### **Terminal 2 - Blog:**
```bash
cd examples/blog-example
npm run db:init && npm run dev
# ✅ Database: ssot_blog
# ✅ Port: 3001
```

### **Terminal 3 - E-commerce:**
```bash
cd examples/ecommerce-example
npm run db:init && npm run dev
# ✅ Database: ssot_ecommerce
# ✅ Port: 3002
```

### **Terminal 4 - Minimal:**
```bash
cd examples/minimal
npm run db:init && npm run dev
# ✅ Database: ssot_minimal
# ✅ Port: 3003
```

**Result:**
- ✅ 4 servers running
- ✅ 4 separate databases
- ✅ Zero conflicts
- ✅ Zero manual configuration

---

## 📋 What Each Example Does

### **Demo Example (Port 3000):**
**Models:** User, Todo  
**Features:**
- JWT authentication (register, login, refresh)
- Todo CRUD operations
- User relationships
- Full type safety
- Validation with Zod

**Test:**
```bash
# Health check
curl http://localhost:3000/health

# Register user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!@#"}'
```

---

### **Blog Example (Port 3001):**
**Models:** User, Post, Comment, Category  
**Features:**
- Multi-model relationships
- Complex queries
- Filtering & pagination
- Full CRUD for all models

**Test:**
```bash
curl http://localhost:3001/health
```

---

### **E-commerce Example (Port 3002):**
**Models:** 17 models (User, Product, Order, Payment, etc.)  
**Features:**
- Complex e-commerce domain
- Multi-table joins
- Transaction handling
- Inventory management
- Order processing

**Test:**
```bash
curl http://localhost:3002/health
```

---

### **Minimal Example (Port 3003):**
**Models:** Minimal set  
**Features:**
- Bare minimum setup
- Quick prototyping
- Testing code generation

**Test:**
```bash
curl http://localhost:3003/health
```

---

## 🔧 Database Credentials

### **All Examples Use:**
```
Database Provider: MySQL
Host: localhost
Port: 3306
User: root
Password: (blank - no password)
```

**Change credentials:**
```bash
# Edit any example's .env file
DB_USER=myuser
DB_PASSWORD=mypassword
```

**Use PostgreSQL instead:**
```bash
# Edit .env
DB_PROVIDER=postgresql
DB_PORT=5432
DB_USER=postgres
```

---

## 🎯 Zero-Config Workflow

### **What happens when you run `npm run db:init`:**

1. ✅ Reads `.env` file (already exists!)
2. ✅ Connects to MySQL (root, no password)
3. ✅ Checks if database exists
4. ✅ Creates database if missing (`CREATE DATABASE IF NOT EXISTS`)
5. ✅ Generates DATABASE_URL
6. ✅ Runs `prisma db push`
7. ✅ Creates all tables
8. ✅ Ready to use!

**You do:** Run one command  
**System does:** Everything else

---

## 📊 Database Summary

After running `npm run db:init` in all examples:

```sql
-- MySQL databases created:
SHOW DATABASES;

+-------------------+
| Database          |
+-------------------+
| ssot_demo         | ← Demo example
| ssot_blog         | ← Blog example
| ssot_ecommerce    | ← E-commerce example
| ssot_minimal      | ← Minimal example
+-------------------+
```

**All auto-created, no manual work!**

---

## ✅ Checklist

### **Prerequisites:**
- [ ] MySQL running on localhost:3306
- [ ] MySQL `root` user with no password (or edit `.env`)

### **For Each Example:**
- [ ] `cd examples/<example-name>`
- [ ] `npm install`
- [ ] `npm run db:init`
- [ ] `npm run dev`
- [ ] Test at `http://localhost:<port>/health`

---

## 🐛 Troubleshooting

### **MySQL not running:**
```bash
# macOS
brew services start mysql

# Linux
sudo systemctl start mysql

# Windows (as Administrator)
net start MySQL
```

### **Root has password:**
```bash
# Option 1: Edit .env
DB_PASSWORD=your_root_password

# Option 2: Remove password
mysql -u root -p
ALTER USER 'root'@'localhost' IDENTIFIED BY '';
```

### **Port already in use:**
```bash
# Edit .env and change PORT
PORT=3010
```

---

## 📚 Full Example Workflow

### **Demo Example (Complete):**
```bash
# 1. Navigate
cd examples/demo-example

# 2. Install (only first time)
npm install

# 3. Setup database (only first time)
npm run db:init

# Output:
# ✅ Created MySQL database: ssot_demo
# ✅ Pushed schema to database

# 4. Generate code
npm run generate

# Output:
# ✅ Generated 26+ files

# 5. Start development
npm run dev

# Output:
# ✅ Database connected
# 🚀 Server running on http://localhost:3000
# 📚 Health check: http://localhost:3000/health

# 6. Test
curl http://localhost:3000/health
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@test.com","password":"Demo123!@#"}'
```

**Total time:** ~1 minute  
**Manual configuration:** Zero!

---

## 🎯 Summary

### **What You Requested:**
> "I prefer to have the real .env files in these examples for these default values use user:root no password (blank). use an appropriate database name"

### **What You Got:**
✅ **Real `.env` files** (not `.env.example`)  
✅ **`DB_USER=root`** (exactly as requested)  
✅ **`DB_PASSWORD=`** (blank, exactly as requested)  
✅ **Appropriate database names:**
- `ssot_demo`
- `ssot_blog`
- `ssot_ecommerce`
- `ssot_minimal`

### **Bonus:**
✅ Auto-database creation  
✅ Unique ports per example  
✅ Run all simultaneously  
✅ Zero manual configuration  

---

**All examples are now ready to run with ZERO configuration!** 🚀

Just:
```bash
cd examples/<any-example>
npm run db:init
npm run dev
```

That's it!

