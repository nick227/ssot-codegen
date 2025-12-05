# Quick Start Guide

## 🚀 Get Started in 3 Steps

### 1. Install Dependencies
```bash
# From workspace root
pnpm install
```

### 2. Setup Database
```bash
cd websites/dating-app/src

# Generate Prisma Client
pnpm db:generate

# Push schema to database (creates tables)
pnpm db:push
```

**Note:** Ensure MySQL is running and database `dating-app` exists.

### 3. Start Servers

**Terminal 1 - Backend:**
```bash
cd websites/dating-app/src
pnpm dev
```
Backend runs on `http://localhost:3000`

**Terminal 2 - Frontend:**
```bash
cd websites/dating-app/frontend
pnpm dev
```
Frontend runs on `http://localhost:3001`

## ✅ Verify Setup

1. **Backend Health Check:**
   ```bash
   curl http://localhost:3000/health
   ```
   Should return: `{"status":"ok","timestamp":"..."}`

2. **Frontend:**
   - Open `http://localhost:3001` in browser
   - Should see home page without errors
   - Check browser console for any issues

## 📝 Environment Variables

Create `.env` in workspace root:
```env
DATABASE_URL="mysql://root:@localhost:3306/dating-app"
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3001
```

## 🐛 Troubleshooting

### Database Connection Error
- Verify MySQL is running
- Check `DATABASE_URL` in `.env`
- Ensure database `dating-app` exists

### Port Already in Use
- Change `PORT` in `.env` (backend)
- Change port in `vite.config.ts` (frontend)

### TypeScript Errors
- Run `pnpm install` to ensure all types are installed
- Some React type errors may be false positives - code should still run

## 📚 Next Steps

See `TESTING_SETUP.md` for detailed testing instructions.

