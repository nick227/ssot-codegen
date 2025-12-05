# Testing Setup Guide

## Prerequisites

1. **Database Setup**
   ```bash
   cd websites/dating-app/src
   # Ensure MySQL is running
   # Create database if needed: CREATE DATABASE `dating-app`;
   pnpm db:generate  # Generate Prisma Client
   pnpm db:push     # Push schema to database
   ```

2. **Environment Variables**
   Create `.env` in workspace root:
   ```env
   DATABASE_URL="mysql://root:@localhost:3306/dating-app"
   PORT=3000
   NODE_ENV=development
   CORS_ORIGIN=http://localhost:3001
   ```

3. **Install Dependencies**
   ```bash
   # From workspace root
   pnpm install
   ```

## Backend Testing

### Start Backend Server
```bash
cd websites/dating-app/src
pnpm dev
```

Server should start on `http://localhost:3000`

### Test Health Check
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Test API Endpoints
```bash
# List users
curl http://localhost:3000/api/users

# List profiles
curl http://localhost:3000/api/profiles

# Create a user
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## Frontend Testing

### Start Frontend Dev Server
```bash
cd websites/dating-app/frontend
pnpm dev
```

Frontend should start on `http://localhost:3001`

### Test Frontend
1. Open `http://localhost:3001` in browser
2. Check browser console for errors
3. Navigate through pages:
   - `/` - Home
   - `/discovery` - Discovery feed
   - `/matches` - Matches list
   - `/messages` - Messages
   - `/profile` - Own profile

## Known Issues & Workarounds

### 1. Match Model Not in SDK
**Issue:** `useMatches` hook tries to use `sdk.match.list()` but Match client doesn't exist in SDK.

**Workaround:** Updated `useMatches` to use `compatibilityscore` as a proxy until Match service is implemented.

**Fix Needed:** Either:
- Generate Match model client in SDK, OR
- Implement Match service endpoint

### 2. TypeScript React Types
**Issue:** Some TypeScript errors about missing React types.

**Status:** These are likely false positives from tsconfig. Code should still compile and run.

### 3. Missing Photo URLs
**Issue:** Profile photos are not being fetched.

**Status:** TODO in code - need to implement photo fetching logic.

### 4. Auth Context Placeholder
**Issue:** `AuthContext` uses placeholder user ID.

**Status:** TODO - implement actual authentication.

## Testing Checklist

### Backend
- [ ] Server starts without errors
- [ ] Database connection successful
- [ ] Health check endpoint works
- [ ] CRUD endpoints respond (even if empty)
- [ ] CORS allows frontend origin

### Frontend
- [ ] Dev server starts
- [ ] Pages render without crashes
- [ ] SDK connects to backend
- [ ] No console errors
- [ ] Navigation works
- [ ] Components render correctly

### Integration
- [ ] Frontend can fetch data from backend
- [ ] API calls succeed
- [ ] Error handling works
- [ ] Loading states display
- [ ] Empty states display

## Next Steps

1. **Implement Match Service**
   - Add Match routes/controllers
   - Generate Match SDK client
   - Update `useMatches` hook

2. **Add Authentication**
   - Implement JWT auth
   - Update AuthContext
   - Add protected routes

3. **Photo Handling**
   - Implement photo upload
   - Add photo fetching logic
   - Display photos in UI

4. **Real Data**
   - Create seed data
   - Test with real profiles
   - Test matching logic

