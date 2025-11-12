# Example Schemas

**Purpose**: Reference schemas for testing and documentation.

These schemas align with our 3 presets:
- `media-schema.prisma` - SoundCloud-like app
- `marketplace-schema.prisma` - E-commerce platform
- `saas-schema.prisma` - Multi-tenant SaaS

**Usage**:

```bash
# Test with example schema
pnpm test -- examples/media-schema.prisma

# Generate from example
npx create-ssot-app test-app --schema examples/media-schema.prisma
```

**Conventions Demonstrated**:
- ✅ String IDs (cuid/uuid)
- ✅ Owner fields (uploadedBy, userId, vendorId)
- ✅ Public fields (isPublic)
- ✅ Timestamps (createdAt, updatedAt)
- ✅ Relations (1:many, many:many)

