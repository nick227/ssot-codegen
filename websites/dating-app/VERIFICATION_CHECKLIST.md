# Verification Checklist

Use this checklist to verify your setup is working correctly.

## ✅ Pre-Flight Checks

- [ ] Dependencies installed (`pnpm install` from workspace root)
- [ ] MySQL database `dating-app` exists
- [ ] `.env` file exists in workspace root with `DATABASE_URL`
- [ ] Prisma Client generated (`cd src && pnpm db:generate`)

---

## 🔧 Backend Verification

### Start Backend
```bash
cd websites/dating-app/src
pnpm dev
```

### Check Backend
- [ ] Server starts without errors
- [ ] See "✅ Database connected" message
- [ ] See "🚀 Server running on http://localhost:3000"
- [ ] Health check works: `curl http://localhost:3000/health`
  - Expected: `{"status":"ok","timestamp":"..."}`

### Test API Endpoints
```bash
# List users (should return empty array or data)
curl http://localhost:3000/api/users

# List profiles (should return empty array or data)
curl http://localhost:3000/api/profiles

# Health check
curl http://localhost:3000/health
```

- [ ] All endpoints respond (even if empty)
- [ ] No CORS errors
- [ ] No 500 errors

---

## 🎨 Frontend Verification

### Start Frontend
```bash
cd websites/dating-app/frontend
pnpm dev
```

### Check Frontend
- [ ] Dev server starts without errors
- [ ] See "Local: http://localhost:3001"
- [ ] Browser opens automatically (or navigate manually)
- [ ] No build errors in terminal

### Test Pages
Navigate to each page and verify:

- [ ] **Home (`/`)** - Renders without errors
- [ ] **Discovery (`/discovery`)** - Shows empty state or profiles
- [ ] **Matches (`/matches`)** - Shows empty state or matches
- [ ] **Messages (`/messages`)** - Shows empty state or threads
- [ ] **Profile (`/profile`)** - Shows profile page

### Check Browser Console
- [ ] No red errors
- [ ] SDK connects successfully
- [ ] API calls succeed (even if empty responses)
- [ ] No CORS errors

---

## 🔗 Integration Verification

### Test SDK Connection
1. Open browser DevTools → Network tab
2. Navigate to Discovery page
3. Check for API calls to `/api/profiles`
4. Verify requests succeed (200 status)

### Test Navigation
- [ ] Bottom navigation works
- [ ] Page transitions smooth
- [ ] Back button works (if applicable)
- [ ] Routes update correctly

---

## 🐛 Troubleshooting

### Backend Won't Start
- Check MySQL is running
- Verify `DATABASE_URL` in `.env`
- Check port 3000 is available
- Run `pnpm db:generate` again

### Frontend Won't Start
- Check port 3001 is available
- Verify all dependencies installed
- Check for TypeScript errors: `pnpm typecheck`

### API Calls Fail
- Verify backend is running
- Check CORS configuration
- Verify API prefix matches (`/api`)
- Check browser console for errors

### Database Errors
- Verify MySQL is running
- Check database `dating-app` exists
- Run `pnpm db:push` to sync schema
- Check `.env` `DATABASE_URL` format

---

## ✅ Success Criteria

You're ready to proceed when:

- ✅ Both servers start without errors
- ✅ Health check returns `{"status":"ok"}`
- ✅ Frontend pages render without crashes
- ✅ No console errors
- ✅ API calls succeed (even if empty)

---

## 📝 Notes

- Empty responses are expected until services are implemented
- TypeScript warnings are non-blocking
- Fast refresh warnings in contexts are expected

---

**Once all checks pass, you're ready to start implementing features!**

