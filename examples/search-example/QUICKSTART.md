# 🚀 Search Example - Quick Start

Get up and running with full-text search in **5 minutes**.

## Prerequisites

- Node.js 18+
- PostgreSQL database
- pnpm (recommended) or npm

## Step-by-Step

### 1️⃣ Setup Database

```bash
# Create database
createdb search_example

# Set environment variable
export DATABASE_URL="postgresql://user:password@localhost:5432/search_example"

# Or create .env file
echo 'DATABASE_URL="postgresql://user:password@localhost:5432/search_example"' > .env
```

### 2️⃣ Install & Generate

```bash
# Install dependencies
npm install

# Run migrations
npx prisma migrate dev --name init

# Generate API
npx prisma generate
```

### 3️⃣ Seed Data

```bash
npm run seed
```

**Seeded:**
- 3 users
- 8 products (laptops, mice, keyboards, etc.)
- 4 blog posts
- 4 reviews

### 4️⃣ Start Server

```bash
cd generated
npm install
npm run dev
```

Server runs at `http://localhost:3000`

### 5️⃣ Test Search

```bash
# In another terminal
cd ..
node test-search.js
```

## Example Searches

### Product Search
```bash
curl "http://localhost:3000/api/search?q=laptop&model=product"
```

### User Search
```bash
curl "http://localhost:3000/api/search?q=john&model=user"
```

### Blog Search
```bash
curl "http://localhost:3000/api/search?q=typescript&model=blogpost"
```

### Federated Search (All Models)
```bash
curl "http://localhost:3000/api/search/all?q=gaming"
```

## What You Get

✅ **4 Searchable Models** - Product, User, BlogPost, Review  
✅ **Intelligent Ranking** - Recent and popular items boosted  
✅ **Smart Scoring** - Field weights and match types  
✅ **Full Pagination** - Complete metadata  
✅ **Type-Safe** - Full TypeScript support  

## Next Steps

1. **Modify weights** in `ssot.config.ts` and regenerate
2. **Add fields** to search configuration
3. **Tune ranking** boosts for your use case
4. **Build search UI** using pagination metadata
5. **Add to your own project** - copy the plugin config!

## Troubleshooting

**"No results found"**
- Run `npm run seed` to add sample data
- Check if server is running on port 3000

**"Connection refused"**
- Ensure PostgreSQL is running
- Check DATABASE_URL is correct

**"Plugin not found"**
- Run `npx prisma generate` from search-example directory
- Ensure ssot.config.ts exists

## Learn More

- [Full README](README.md)
- [Plugin Documentation](../../packages/gen/src/plugins/search/README.md)
- [Review & Fixes](../../packages/gen/src/plugins/search/REVIEW_AND_FIXES.md)

**Ready to search? Start the server and visit http://localhost:3000** 🚀

