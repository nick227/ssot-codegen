# Demo Example - Complete Setup Guide

**Database:** `ssot_demo` (auto-created)  
**Port:** 3000  
**Status:** ✅ Production-ready with authentication

---

## 🚀 Quick Start (30 seconds!)

### **Option 1: Default MySQL (Easiest)**

Assumes MySQL running locally with `root` user and no password:

```bash
# 1. Copy environment file
cp .env.example .env

# 2. Setup database (auto-creates ssot_demo!)
npm install
npm run db:init

# 3. Start development server
npm run dev

# 4. Test authentication
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!@#"}'
```

**Done!** Server running on http://localhost:3000 with database `ssot_demo` auto-created.

---

### **Option 2: Custom Credentials**

If your MySQL has a password or different user:

```bash
# 1. Copy and edit .env
cp .env.example .env

# 2. Update credentials in .env
DB_USER="myuser"
DB_PASSWORD="mypassword"
DB_NAME="ssot_demo"

# 3. Setup and start
npm install
npm run db:init
npm run dev
```

---

### **Option 3: PostgreSQL**

```bash
# 1. Edit .env
cp .env.example .env

# 2. Change to PostgreSQL
DB_PROVIDER="postgresql"
DB_PORT="5432"
DB_USER="postgres"
DB_PASSWORD="postgres"
DB_NAME="ssot_demo"

# 3. Setup and start
npm install
npm run db:init
npm run dev
```

---

### **Option 4: SQLite (No Server!)**

Perfect for quick testing:

```bash
# 1. Edit .env
cp .env.example .env

# 2. Change to SQLite
DB_PROVIDER="sqlite"
DB_NAME="demo"

# 3. Setup and start
npm install
npm run db:init
npm run dev

# Creates ./demo.db automatically!
```

---

## 📝 What Gets Created

### **Databases:**
- `ssot_demo` (MySQL/PostgreSQL) - Auto-created if doesn't exist
- `./demo.db` (SQLite) - Created by Prisma

### **Tables:**
- `users` - With authentication
- `todos` - With user relationships

### **Generated Code:**
- 26+ files in `gen/` directory
- DTOs, validators, services, controllers, routes
- Full type safety
- Working CRUD operations

---

## 🧪 Testing the API

### **1. Register a User:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!",
    "name": "John Doe"
  }'

# Response:
{
  "user": {
    "id": 1,
    "email": "john@example.com",
    "name": "John Doe",
    "createdAt": "2025-11-04T..."
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": "7d"
}
```

### **2. Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

### **3. Get Profile (Protected):**
```bash
TOKEN="<accessToken from login>"

curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

### **4. Health Check:**
```bash
curl http://localhost:3000/health

# Response:
{
  "status": "ok",
  "timestamp": "2025-11-04T10:30:00.000Z"
}
```

---

## 🛠️ Available Scripts

```bash
# Database
npm run db:setup      # Check and create database
npm run db:init       # Setup database + push schema
npm run db:push       # Push schema to database
npm run db:migrate    # Create and run migrations
npm run db:studio     # Open Prisma Studio

# Development
npm run dev           # Start with hot reload
npm run build         # Build for production
npm run start         # Run production build
npm run generate      # Generate Prisma Client + code

# Quality
npm run typecheck     # TypeScript type checking
npm run test          # Run tests
npm run test:watch    # Test watch mode
npm run test:coverage # Test with coverage
```

---

## 📦 Project Structure

```
demo-example/
├── prisma/
│   └── schema.prisma         # Database schema with User & Todo
├── src/
│   ├── server.ts            # Entry point
│   ├── app.ts               # Express app with rate limiting
│   ├── db.ts                # Prisma client
│   ├── config.ts            # Environment config
│   ├── middleware.ts        # Error handlers
│   ├── logger.ts            # Structured logging
│   └── auth/
│       ├── jwt.ts           # JWT token management
│       ├── password.ts      # Secure password hashing
│       └── routes.ts        # Auth API endpoints
├── gen/                     # Generated code (26+ files)
│   ├── contracts/           # TypeScript DTOs
│   ├── validators/          # Zod schemas
│   ├── services/            # Business logic with Prisma
│   ├── controllers/         # HTTP handlers
│   ├── routes/              # API routes
│   └── openapi/             # OpenAPI spec
├── scripts/
│   ├── generate.js          # Code generation
│   └── db-setup.js          # Database setup (NEW!)
├── .env.example             # Environment template
├── Dockerfile               # Docker build
├── docker-compose.yml       # Full stack setup
└── AUTH_GUIDE.md            # Authentication docs
```

---

## 🐛 Common Issues

### **"Database does not exist"**
```bash
# Run database setup
npm run db:setup

# Or combined
npm run db:init
```

### **"Access denied for user 'root'"**
```bash
# Check MySQL is running
mysql.server start  # macOS
sudo systemctl start mysql  # Linux

# Or set password in .env
DB_PASSWORD="your-password"
```

### **"Port 3000 already in use"**
```bash
# Change port in .env
PORT=3001

# Or kill process on port 3000
lsof -ti:3000 | xargs kill  # macOS/Linux
```

---

## 🚀 Deploy to Docker

### **Using docker-compose (Full Stack):**
```bash
# Start everything (app + database)
docker-compose up -d

# Check logs
docker-compose logs -f app

# Stop everything
docker-compose down
```

### **Using Docker only:**
```bash
# Build image
docker build -t demo-api .

# Run with existing database
docker run -p 3000:3000 \
  -e DATABASE_URL="mysql://root@host.docker.internal:3306/ssot_demo" \
  demo-api
```

---

## ✅ Checklist

### **First Time Setup:**
- [ ] MySQL/PostgreSQL running (or use SQLite)
- [ ] Copy `.env.example` to `.env`
- [ ] (Optional) Customize `DB_*` variables
- [ ] Run `npm install`
- [ ] Run `npm run db:init` (creates database + schema)
- [ ] Run `npm run dev`
- [ ] Test http://localhost:3000/health

### **Every Day:**
- [ ] Run `npm run dev`
- [ ] Make schema changes in `prisma/schema.prisma`
- [ ] Run `npm run generate` to regenerate code
- [ ] Test your API

---

## 💡 Pro Tips

### **Multiple Examples Running:**
Run all three examples at once without conflicts:

```bash
# Terminal 1 - Demo (port 3000, ssot_demo)
cd examples/demo-example
npm run db:init
npm run dev

# Terminal 2 - Blog (port 3001, ssot_blog)
cd examples/blog-example
npm run db:init
npm run dev

# Terminal 3 - Ecommerce (port 3002, ssot_ecommerce)
cd examples/ecommerce-example
npm run db:init
npm run dev
```

All running simultaneously with isolated databases!

### **Quick Database Reset:**
```bash
# Drop and recreate (WARNING: loses all data)
mysql -u root -e "DROP DATABASE IF EXISTS ssot_demo; CREATE DATABASE ssot_demo"
npm run db:push
```

### **View Database:**
```bash
# Prisma Studio (GUI)
npm run db:studio

# Or directly
mysql -u root ssot_demo
# or
psql -U postgres ssot_demo
```

---

**Setup is now automatic and flexible!** 🎉

Choose your database, set credentials (or use defaults), run `npm run db:init`, and you're ready to go!

