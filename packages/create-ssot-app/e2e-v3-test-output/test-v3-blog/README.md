# test-v3-blog

Full-stack TypeScript API built with **SSOT CodeGen**.

## 🚀 Stack

- **Framework**: Express
- **Database**: Sqlite
- **ORM**: Prisma
- **Language**: TypeScript

## 🔌 Plugins Included

No plugins configured. You can add plugins by editing `ssot.config.ts` and regenerating.

## 📦 What's Included

- ✅ Complete REST API with CRUD operations
- ✅ Auto-generated DTOs and validators
- ✅ Type-safe database client
- ✅ Type-safe SDK for frontend
- ✅ React hooks (optional)
- ✅ OpenAPI documentation
- ✅ Error handling
- ✅ Request validation

## 🛠️ Development

```bash
# Start dev server with hot reload
npm run dev

# Push database schema (for prototyping)
npm run db:push

# Create migration (for production)
npm run db:migrate

# Open Prisma Studio (database GUI)
npm run db:studio
```

## 📝 Edit Your Schema

1. Edit `prisma/schema.prisma`
2. Run `npm run generate` to regenerate API code
3. Run `npm run db:push` to update database

## 🏗️ Build for Production

```bash
# Build TypeScript
npm run build

# Start production server
npm run start
```

## 📚 API Endpoints

After generation, check `generated/CHECKLIST.md` for:
- All available endpoints
- Request/response examples
- SDK usage examples

## 🔧 Configuration

Edit `ssot.config.ts` to customize:
- Output directory
- Hook frameworks (React, Vue, etc.)
- Plugin settings
- Error handling

## 📖 Learn More

- [SSOT CodeGen Docs](https://github.com/yourusername/ssot-codegen)
- [Prisma Docs](https://www.prisma.io/docs)
- [Express Docs](https://expressjs.com)

---

Built with ❤️ using **create-ssot-app**
