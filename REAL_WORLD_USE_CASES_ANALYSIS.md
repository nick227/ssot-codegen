# 🎵 Real-World Use Cases: Expression System in Action

## The Three Apps

Let's analyze how the expression system applies to your **actual projects**:

1. **🎵 SoundCloud Clone** - Music streaming platform
2. **🍔 DoorDash Clone** - Multi-vendor food delivery
3. **🎭 Talent Agency** - Actor/musician booking platform

---

## The Pattern: Shared + Unique Features

All three apps have:

### **Shared Features** (90% reusable)
- User authentication & profiles
- Search & filtering
- Notifications
- File uploads
- Payment processing (Stripe)
- Reviews & ratings
- Admin dashboard

### **Unique Features** (10% custom)
- **SoundCloud**: Audio streaming, playlists, waveforms
- **DoorDash**: Real-time orders, delivery tracking, multi-vendor
- **Talent Agency**: Portfolios, auditions, booking calendars

---

## How Expressions Enable Reusability

### **Example 1: Shared Logic Across All Three Apps**

#### **"Show Edit Button Only to Owner"**

**SoundCloud** - Edit track:
```json
{
  "component": "EditButton",
  "visibleWhen": {
    "type": "condition",
    "op": "eq",
    "left": { "type": "field", "path": "uploadedBy" },
    "right": { "type": "field", "path": "user.id" }
  }
}
```

**DoorDash** - Edit menu item:
```json
{
  "component": "EditButton",
  "visibleWhen": {
    "type": "condition",
    "op": "eq",
    "left": { "type": "field", "path": "vendorId" },
    "right": { "type": "field", "path": "user.vendorProfile.id" }
  }
}
```

**Talent Agency** - Edit portfolio:
```json
{
  "component": "EditButton",
  "visibleWhen": {
    "type": "condition",
    "op": "eq",
    "left": { "type": "field", "path": "artistId" },
    "right": { "type": "field", "path": "user.artistProfile.id" }
  }
}
```

**Reusable Pattern**:
```json
// shared-patterns.json
{
  "patterns": {
    "isOwner": {
      "type": "condition",
      "op": "eq",
      "left": { "type": "field", "path": "{ownerField}" },
      "right": { "type": "field", "path": "user.id" }
    }
  }
}
```

✅ **Same pattern, different fields** - Expression system enables this!

---

### **Example 2: Payment Calculations (Stripe)**

All three apps use Stripe, but with different business logic:

#### **SoundCloud Clone - Subscription Pricing**

```prisma
model Subscription {
  id              String   @id
  userId          String
  tier            String   // "free", "pro", "premium"
  monthlyPrice    Float
  discountCode    String?
  
  // Computed fields
  discountAmount  Float    // Computed
  finalPrice      Float    // Computed
  annualSavings   Float    // Computed
}
```

**Template (auto-generated from Prisma)**:
```json
{
  "field": "finalPrice",
  "computed": {
    "type": "operation",
    "op": "subtract",
    "args": [
      { "type": "field", "path": "monthlyPrice" },
      { "type": "field", "path": "discountAmount" }
    ]
  }
},
{
  "field": "discountAmount",
  "computed": {
    "type": "condition",
    "op": "eq",
    "left": { "type": "field", "path": "tier" },
    "right": { "type": "literal", "value": "annual" },
    "then": {
      "type": "operation",
      "op": "multiply",
      "args": [
        { "type": "field", "path": "monthlyPrice" },
        { "type": "literal", "value": 0.2 }
      ]
    },
    "else": { "type": "literal", "value": 0 }
  }
}
```

**Result**: User sees calculated price in real-time as they select options.

---

#### **DoorDash Clone - Order Total Calculation**

```prisma
model Order {
  id              String   @id
  subtotal        Float
  deliveryFee     Float
  taxRate         Float
  tipAmount       Float
  discountCode    String?
  
  // Computed fields
  tax             Float    // Computed
  discount        Float    // Computed
  total           Float    // Computed
}
```

**Template**:
```json
{
  "field": "tax",
  "computed": {
    "type": "operation",
    "op": "multiply",
    "args": [
      { "type": "field", "path": "subtotal" },
      { "type": "field", "path": "taxRate" }
    ]
  }
},
{
  "field": "total",
  "computed": {
    "type": "operation",
    "op": "add",
    "args": [
      { "type": "field", "path": "subtotal" },
      { "type": "field", "path": "tax" },
      { "type": "field", "path": "deliveryFee" },
      { "type": "field", "path": "tipAmount" },
      {
        "type": "operation",
        "op": "multiply",
        "args": [
          { "type": "field", "path": "discount" },
          { "type": "literal", "value": -1 }
        ]
      }
    ]
  }
}
```

**Result**: Order total updates live as user adds items, selects tip, applies promo codes.

---

#### **Talent Agency - Booking Fee Calculation**

```prisma
model Booking {
  id              String   @id
  artistId        String
  hours           Float
  hourlyRate      Float
  platformFee     Float    // 10% platform fee
  
  // Computed fields
  subtotal        Float    // Computed
  fee             Float    // Computed
  artistPayout    Float    // Computed
  totalCost       Float    // Computed
}
```

**Template**:
```json
{
  "field": "subtotal",
  "computed": {
    "type": "operation",
    "op": "multiply",
    "args": [
      { "type": "field", "path": "hours" },
      { "type": "field", "path": "hourlyRate" }
    ]
  }
},
{
  "field": "fee",
  "computed": {
    "type": "operation",
    "op": "multiply",
    "args": [
      { "type": "field", "path": "subtotal" },
      { "type": "literal", "value": 0.1 }
    ]
  }
},
{
  "field": "artistPayout",
  "computed": {
    "type": "operation",
    "op": "subtract",
    "args": [
      { "type": "field", "path": "subtotal" },
      { "type": "field", "path": "fee" }
    ]
  }
}
```

**Reusable Calculation Pattern**:
```typescript
// All three apps use similar calculation patterns:
// base × rate = subtotal
// subtotal × discount/fee = adjustment
// subtotal ± adjustments = total

// Expression system captures this pattern in JSON
// No code duplication across apps!
```

✅ **Same calculation patterns, different business rules** - Expressions handle this!

---

### **Example 3: Role-Based Permissions**

All three apps have different user roles, but similar permission logic:

#### **SoundCloud Clone - Content Visibility**

```prisma
model Track {
  id              String   @id
  title           String
  uploadedBy      String
  visibility      String   // "public", "private", "followers"
  isPremiumOnly   Boolean
}
```

**Template**:
```json
{
  "field": "playButton",
  "visibleWhen": {
    "type": "operation",
    "op": "or",
    "args": [
      {
        "type": "condition",
        "op": "eq",
        "left": { "type": "field", "path": "visibility" },
        "right": { "type": "literal", "value": "public" }
      },
      {
        "type": "condition",
        "op": "eq",
        "left": { "type": "field", "path": "uploadedBy" },
        "right": { "type": "field", "path": "user.id" }
      },
      {
        "type": "operation",
        "op": "and",
        "args": [
          {
            "type": "condition",
            "op": "eq",
            "left": { "type": "field", "path": "visibility" },
            "right": { "type": "literal", "value": "followers" }
          },
          {
            "type": "permission",
            "check": "isFollowing",
            "args": [{ "type": "field", "path": "uploadedBy" }]
          }
        ]
      },
      {
        "type": "operation",
        "op": "and",
        "args": [
          {
            "type": "condition",
            "op": "eq",
            "left": { "type": "field", "path": "isPremiumOnly" },
            "right": { "type": "literal", "value": true }
          },
          {
            "type": "permission",
            "check": "hasRole",
            "args": ["premium"]
          }
        ]
      }
    ]
  }
}
```

**Result**: Track is visible if:
- Public, OR
- User is the uploader, OR
- Followers-only AND user is following, OR
- Premium-only AND user has premium

---

#### **DoorDash Clone - Vendor Dashboard Access**

```json
{
  "page": "VendorDashboard",
  "visibleWhen": {
    "type": "permission",
    "check": "hasAnyRole",
    "args": ["vendor", "admin"]
  },
  "sections": [
    {
      "title": "Analytics",
      "visibleWhen": {
        "type": "permission",
        "check": "hasRole",
        "args": ["vendor"]
      }
    },
    {
      "title": "All Vendors",
      "visibleWhen": {
        "type": "permission",
        "check": "hasRole",
        "args": ["admin"]
      }
    }
  ]
}
```

---

#### **Talent Agency - Booking Management**

```json
{
  "field": "bookingActions",
  "visibleWhen": {
    "type": "operation",
    "op": "or",
    "args": [
      {
        "type": "permission",
        "check": "hasRole",
        "args": ["admin"]
      },
      {
        "type": "operation",
        "op": "and",
        "args": [
          {
            "type": "condition",
            "op": "eq",
            "left": { "type": "field", "path": "artistId" },
            "right": { "type": "field", "path": "user.artistProfile.id" }
          },
          {
            "type": "condition",
            "op": "eq",
            "left": { "type": "field", "path": "status" },
            "right": { "type": "literal", "value": "pending" }
          }
        ]
      }
    ]
  }
}
```

✅ **Complex permission logic without code** - Expressions shine here!

---

### **Example 4: Dynamic Status Display**

#### **SoundCloud - Track Status Badge**

```json
{
  "field": "statusBadge",
  "computed": {
    "type": "condition",
    "op": "eq",
    "left": { "type": "field", "path": "processing" },
    "right": { "type": "literal", "value": true },
    "then": { "type": "literal", "value": "Processing..." },
    "else": {
      "type": "condition",
      "op": "gte",
      "left": { "type": "field", "path": "plays" },
      "right": { "type": "literal", "value": 1000 },
      "then": { "type": "literal", "value": "🔥 Trending" },
      "else": { "type": "literal", "value": "Ready" }
    }
  }
}
```

**Result**: 
- "Processing..." if still uploading
- "🔥 Trending" if plays >= 1000
- "Ready" otherwise

---

#### **DoorDash - Order Status with Time**

```json
{
  "field": "orderStatus",
  "computed": {
    "type": "operation",
    "op": "concat",
    "args": [
      { "type": "field", "path": "status" },
      { "type": "literal", "value": " - ETA: " },
      {
        "type": "operation",
        "op": "formatDate",
        "args": [
          { "type": "field", "path": "estimatedDelivery" },
          { "type": "literal", "value": "h:mm a" }
        ]
      }
    ]
  }
}
```

**Result**: "Out for Delivery - ETA: 7:30 PM"

---

#### **Talent Agency - Availability Status**

```json
{
  "field": "availabilityStatus",
  "computed": {
    "type": "condition",
    "op": "eq",
    "left": { "type": "field", "path": "bookingCount" },
    "right": { "type": "literal", "value": 0 },
    "then": { "type": "literal", "value": "Available" },
    "else": {
      "type": "operation",
      "op": "concat",
      "args": [
        { "type": "literal", "value": "Booked (" },
        {
          "type": "operation",
          "op": "toString",
          "args": [{ "type": "field", "path": "bookingCount" }]
        },
        { "type": "literal", "value": " events)" }
      ]
    }
  }
}
```

**Result**: "Available" or "Booked (3 events)"

---

## Plugin Integration Examples

### **Stripe Plugin - Payment Intent Creation**

Instead of hardcoding Stripe logic, expressions define business rules:

```json
{
  "plugin": "stripe",
  "action": "createPaymentIntent",
  "amount": {
    "computed": {
      "type": "operation",
      "op": "multiply",
      "args": [
        { "type": "field", "path": "totalPrice" },
        { "type": "literal", "value": 100 }
      ]
    }
  },
  "currency": { "type": "literal", "value": "usd" },
  "metadata": {
    "orderId": { "type": "field", "path": "id" },
    "userId": { "type": "field", "path": "user.id" }
  },
  "enabledWhen": {
    "type": "condition",
    "op": "gt",
    "left": { "type": "field", "path": "totalPrice" },
    "right": { "type": "literal", "value": 0 }
  }
}
```

**Same Stripe plugin, different business rules per app!**

---

### **File Upload Plugin - Validation Rules**

**SoundCloud** - Audio upload:
```json
{
  "plugin": "fileUpload",
  "field": "audioFile",
  "validation": {
    "maxSize": { "type": "literal", "value": 104857600 },  // 100MB
    "allowedTypes": {
      "type": "literal",
      "value": ["audio/mpeg", "audio/wav", "audio/flac"]
    },
    "requireAuth": { "type": "literal", "value": true },
    "quotaCheck": {
      "type": "condition",
      "op": "lt",
      "left": { "type": "field", "path": "user.uploadedBytes" },
      "right": { "type": "field", "path": "user.storageQuota" }
    }
  }
}
```

**DoorDash** - Menu image upload:
```json
{
  "plugin": "fileUpload",
  "field": "menuImage",
  "validation": {
    "maxSize": { "type": "literal", "value": 5242880 },  // 5MB
    "allowedTypes": {
      "type": "literal",
      "value": ["image/jpeg", "image/png", "image/webp"]
    },
    "requireAuth": { "type": "literal", "value": true },
    "requireRole": {
      "type": "permission",
      "check": "hasAnyRole",
      "args": ["vendor", "admin"]
    }
  }
}
```

**Talent Agency** - Portfolio media:
```json
{
  "plugin": "fileUpload",
  "field": "portfolioMedia",
  "validation": {
    "maxSize": { "type": "literal", "value": 52428800 },  // 50MB
    "allowedTypes": {
      "type": "literal",
      "value": [
        "image/jpeg", "image/png",
        "video/mp4", "audio/mpeg"
      ]
    },
    "maxFiles": {
      "type": "condition",
      "op": "gte",
      "left": { "type": "field", "path": "user.subscriptionTier" },
      "right": { "type": "literal", "value": "pro" },
      "then": { "type": "literal", "value": 50 },
      "else": { "type": "literal", "value": 10 }
    }
  }
}
```

✅ **Same plugin, different rules via expressions!**

---

## The Reusability Matrix

| Feature | SoundCloud | DoorDash | Talent Agency | Reusable via Expressions? |
|---------|------------|----------|---------------|--------------------------|
| **Auth & Profiles** | ✅ Users | ✅ Users/Vendors | ✅ Users/Artists | ✅ 100% reusable |
| **Payment Calc** | Subscription | Order total | Booking fee | ✅ 90% reusable (same patterns) |
| **Permissions** | Content visibility | Vendor access | Artist/booking | ✅ 95% reusable (role checks) |
| **File Upload** | Audio files | Menu images | Portfolio media | ✅ 100% reusable (diff rules) |
| **Status Display** | Track status | Order status | Availability | ✅ 90% reusable (formatting) |
| **Search/Filter** | Tracks/Artists | Restaurants/Food | Artists/Gigs | ✅ 100% reusable |
| **Notifications** | New follower | Order update | Booking request | ✅ 100% reusable |

### **The Key Insight**

**~90% of the logic is SHARED, but with different PARAMETERS.**

Expressions enable:
- ✅ Same patterns across apps
- ✅ Different business rules per app
- ✅ No code duplication
- ✅ Model-driven (derive from Prisma schema)

---

## The Developer Experience

### **Without Expressions (Code Generation)**

**Developer wants to add "discount" feature**:

1. Update Prisma schema (add `discountCode`, `discountAmount`)
2. Run `prisma generate`
3. Run `ssot-codegen generate` (generates API)
4. **Manually write** discount calculation logic in TypeScript
5. **Manually write** UI to display discount
6. **Rebuild** project
7. **Restart** dev server
8. Test changes

**Time**: ~30-60 minutes  
**Files changed**: 5-10 files  
**Copy-paste**: High (same discount logic across 3 apps)

---

### **With Expressions (JSON-First)**

**Developer wants to add "discount" feature**:

1. Update Prisma schema (add `discountCode`, `discountAmount`)
2. Run `prisma generate` → **Auto-generates expression templates**
3. Open `templates/template.json`
4. Add computed field expression (paste from shared patterns):
```json
{
  "field": "discountAmount",
  "computed": {
    "type": "condition",
    "op": "ne",
    "left": { "type": "field", "path": "discountCode" },
    "right": { "type": "literal", "value": null },
    "then": {
      "type": "operation",
      "op": "multiply",
      "args": [
        { "type": "field", "path": "subtotal" },
        { "type": "literal", "value": 0.1 }
      ]
    },
    "else": { "type": "literal", "value": 0 }
  }
}
```
5. **Save** → **Instant hot reload** → See changes

**Time**: ~5-10 minutes  
**Files changed**: 2 files (schema + template)  
**Copy-paste**: Low (reuse pattern, change field names)

---

## The Model-Driven Workflow

### **Goal: Prisma Schema → Complete UI**

```prisma
model Track {
  id            String   @id @default(cuid())
  title         String
  duration      Int      // seconds
  plays         Int      @default(0)
  uploadedBy    String
  uploadedAt    DateTime @default(now())
  
  // Relations
  uploader      User     @relation(fields: [uploadedBy], references: [id])
}
```

### **Auto-Generated Template** (with expressions):

```json
{
  "model": "Track",
  "fields": [
    {
      "field": "title",
      "type": "text",
      "label": "Track Title"
    },
    {
      "field": "duration",
      "type": "number",
      "label": "Duration (seconds)",
      "display": {
        "computed": {
          "type": "operation",
          "op": "formatDuration",
          "args": [{ "type": "field", "path": "duration" }]
        }
      }
    },
    {
      "field": "uploadedAt",
      "type": "datetime",
      "label": "Uploaded",
      "display": {
        "computed": {
          "type": "operation",
          "op": "formatDate",
          "args": [
            { "type": "field", "path": "uploadedAt" },
            { "type": "literal", "value": "MMM DD, YYYY" }
          ]
        }
      }
    },
    {
      "field": "uploader.name",
      "type": "relation",
      "label": "Artist"
    },
    {
      "field": "editButton",
      "type": "action",
      "visibleWhen": {
        "type": "condition",
        "op": "eq",
        "left": { "type": "field", "path": "uploadedBy" },
        "right": { "type": "field", "path": "user.id" }
      }
    }
  ]
}
```

**Result**: Complete CRUD UI with formatting, permissions, relations—all from Prisma schema!

✅ **This is the vision - Model-driven development**

---

## Why Expressions Are ESSENTIAL for Your Use Cases

### **1. You Have Multiple Apps with Shared Patterns**

Without expressions:
- ❌ Copy-paste logic across 3 apps
- ❌ Maintain 3 separate codebases
- ❌ Fix bugs in 3 places

With expressions:
- ✅ Define pattern once
- ✅ Reuse across all apps
- ✅ Fix bugs in one place

---

### **2. You Use Plugins (Stripe, Uploads, etc.)**

Without expressions:
- ❌ Hardcode plugin config in TypeScript
- ❌ Different files for each app
- ❌ Hard to customize per-app

With expressions:
- ✅ Plugin config in JSON
- ✅ Different rules per app
- ✅ Easy to customize via expressions

---

### **3. You Want Model-Driven Development**

Without expressions:
- ❌ Prisma schema → Generate API → **Manually write UI logic**
- ❌ Field changes require code updates

With expressions:
- ✅ Prisma schema → **Auto-generate templates with expressions**
- ✅ Field changes = auto-update UI

---

### **4. You Need Fast Iteration**

Without expressions:
- ❌ Change logic → Rebuild → Restart → Test (~30-60s)
- ❌ Slow feedback loop

With expressions:
- ✅ Change JSON → Hot reload → Test (~instant)
- ✅ Fast feedback loop

---

## The Verdict for YOUR Use Cases

### **Expression System is HIGHLY JUSTIFIED**

Your use cases **perfectly match** what expressions solve:

| Your Requirement | Expression Benefit |
|------------------|-------------------|
| **3+ similar apps** | ✅ Reusable patterns |
| **Shared features** | ✅ DRY principles |
| **Plugin integration** | ✅ Configurable via JSON |
| **Model-driven** | ✅ Auto-generate from Prisma |
| **Fast iteration** | ✅ Hot reload |
| **Multiple developers** | ✅ JSON easier than code |

---

## The Implementation Strategy

### **Phase 1: Foundation** ✅ COMPLETE
- Expression engine
- React hooks
- Type safety

### **Phase 2: Integration** (Next)
- Page renderers (Detail, List, Form)
- Real examples from your apps

### **Phase 3: Reusable Patterns** (After)
- Common expression patterns
- Shared across all 3 apps

### **Phase 4: Plugin System** (Future)
- Stripe integration via expressions
- File upload rules via expressions
- Custom plugins

---

## Recommendation

**✅ PROCEED WITH EXPRESSIONS**

Your use cases are **textbook examples** of when expressions shine:
- Multiple apps with shared patterns
- Plugin integration needs
- Model-driven development goal
- Fast iteration required

The expression system will **dramatically reduce** code duplication and **accelerate** development across your 3+ apps.

---

## Next Steps

1. **Proceed to Phase 2**: Integrate expressions into page renderers
2. **Build real examples**: Use SoundCloud/DoorDash/Talent Agency as test cases
3. **Create pattern library**: Shared expressions across all apps
4. **Plugin integration**: Stripe, file uploads, etc.

**Ready to continue?**

