# 🏢 Multi-Tenant SaaS Example

**Demonstrates:** Tenant Isolation, Workspace Management, Row-Level Security

---

## 🎯 What You'll Learn

Production-ready **multi-tenant SaaS architecture**:

- ✅ **Workspace isolation** - Complete data separation
- ✅ **Team management** - Users, roles, invitations
- ✅ **Subscription handling** - Plans, billing, limits
- ✅ **Row-level security** - Automatic tenant filtering
- ✅ **Usage tracking** - API calls, storage, limits
- ✅ **Admin panel** - Cross-tenant management

**Perfect for:** SaaS platforms, B2B applications, workspace-based apps

---

## 📊 Architecture

```
Workspace (tenant)
  ↓ has many
Users (members)
  ↓ create
Projects (tenant-scoped)
  ↓ contain
Tasks (tenant-scoped)
```

**Key Concept:** Every resource belongs to a workspace. No cross-tenant data leaks!

---

## 🔒 Tenant Isolation

### Schema Design
```prisma
model Project {
  id          Int    @id @default(autoincrement())
  name        String
  description String?
  
  // CRITICAL: Every model has workspaceId
  workspaceId Int
  workspace   Workspace @relation(fields: [workspaceId], references: [id])
  
  @@index([workspaceId])  // Performance
}
```

### Auto-Filtering
```typescript
// Registry automatically adds workspace filter
project: {
  tenantField: 'workspaceId',  // Auto-filter by workspace
  routes: { create: true, list: true }
}
```

**Result:** Users can ONLY see their workspace's data!

---

## 👥 Team Management

### Roles & Permissions
```typescript
workspace: {
  permissions: {
    // Workspace admin can manage everything
    update: ['workspace_admin'],
    delete: ['workspace_admin'],
    
    // Members can view
    read: ['workspace_admin', 'workspace_member']
  }
}
```

### Invitation Flow
```bash
# 1. Admin invites user
POST /api/workspaces/:id/invite
{ "email": "user@example.com", "role": "member" }

# 2. User accepts invitation
POST /api/invitations/:id/accept

# 3. User joins workspace
# Now has access to all workspace resources
```

---

## 💳 Subscription Management

### Plans & Limits
```prisma
model Workspace {
  subscription   Subscription @relation(...)
  
  // Usage tracking
  projectsCount  Int @default(0)
  tasksCount     Int @default(0)
  storageUsed    Int @default(0)
}

model Subscription {
  plan          SubscriptionPlan
  status        SubscriptionStatus
  
  // Limits per plan
  maxProjects   Int
  maxTasks      Int
  maxStorage    Int
}

enum SubscriptionPlan {
  FREE      // 1 project, 100 tasks
  PRO       // 10 projects, 1000 tasks
  ENTERPRISE // Unlimited
}
```

### Enforcement
```typescript
// Automatic limit checking
project: {
  hooks: {
    beforeCreate: async (data, context) => {
      const workspace = await getWorkspace(context.workspaceId)
      if (workspace.projectsCount >= workspace.subscription.maxProjects) {
        throw new Error('Project limit reached. Upgrade your plan!')
      }
    }
  }
}
```

---

## 📊 Usage Tracking

### API Rate Limiting (Per Workspace)
```typescript
workspace: {
  rateLimit: {
    // 1000 requests per hour per workspace
    max: 1000,
    windowMs: 3600000,
    keyGenerator: (req) => req.workspace.id  // Per-workspace limit
  }
}
```

### Storage Tracking
```typescript
file: {
  hooks: {
    afterCreate: async (file, context) => {
      // Update workspace storage usage
      await updateWorkspaceStorage(context.workspaceId, file.size)
    }
  }
}
```

---

## 🎯 API Endpoints

### Workspace Management
```
GET    /api/workspaces              # List user's workspaces
POST   /api/workspaces              # Create workspace
GET    /api/workspaces/:id          # Get workspace
PUT    /api/workspaces/:id          # Update workspace
DELETE /api/workspaces/:id          # Delete workspace

POST   /api/workspaces/:id/invite   # Invite user
GET    /api/workspaces/:id/members  # List members
DELETE /api/workspaces/:id/members/:userId  # Remove member
```

### Tenant-Scoped Resources
```
# All automatically filtered by workspace!
GET    /api/projects                # Only current workspace's projects
POST   /api/projects                # Creates in current workspace
GET    /api/tasks                   # Only current workspace's tasks
```

---

## 🔑 Context Injection

### Automatic Workspace Detection
```typescript
// Middleware extracts workspace from:
// 1. JWT token (workspaceId claim)
// 2. Subdomain (acme.app.com → workspace: acme)
// 3. Header (X-Workspace-ID)

app.use(workspaceMiddleware)

// Now available in all requests
req.workspace = {
  id: 123,
  slug: 'acme',
  name: 'Acme Inc',
  subscription: { plan: 'PRO' }
}
```

---

## 🧪 Example Requests

### Create Workspace
```bash
curl -X POST http://localhost:3000/api/workspaces \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "name": "Acme Inc",
    "slug": "acme"
  }'
```

### Access Via Subdomain
```bash
# Workspace automatically detected from subdomain!
curl https://acme.yourapp.com/api/projects \
  -H "Authorization: Bearer TOKEN"
```

### Create Project (Tenant-Scoped)
```bash
# workspaceId automatically injected
curl -X POST http://localhost:3000/api/projects \
  -H "Authorization: Bearer TOKEN" \
  -H "X-Workspace-ID: 123" \
  -d '{
    "name": "Website Redesign"
  }'
```

---

## 🏗️ Generated Structure

```
src/
├── registry/
│   ├── models.registry.ts      # Tenant-aware config
│   ├── tenant.factory.ts       # Workspace isolation
│   └── subscription.factory.ts # Plan enforcement
├── middleware/
│   ├── workspace.ts            # Workspace detection
│   ├── tenant-isolation.ts     # Auto-filtering
│   └── subscription.ts         # Limit checking
├── services/
│   ├── workspace.service.ts
│   ├── subscription.service.ts
│   └── usage.service.ts
└── admin/
    └── cross-tenant.routes.ts  # Admin-only cross-tenant access
```

---

## 🔒 Security Features

### Data Isolation ✅
- Row-level workspace filtering
- No cross-tenant queries possible
- Automatic index on workspaceId

### Permission Checks ✅
- Role-based access control
- Workspace-level permissions
- Team member verification

### Audit Logging ✅
- All actions logged per workspace
- Security events tracked
- Compliance ready

---

## 📊 Admin Panel

### Cross-Tenant Management
```typescript
// admin.registry.ts (separate from tenant registry)
workspace: {
  permissions: {
    // Only platform admins
    list: ['platform_admin'],
    read: ['platform_admin']
  },
  // NO tenant filtering for admins
  bypassTenantIsolation: true
}
```

### Admin Endpoints
```
GET    /admin/workspaces           # All workspaces
GET    /admin/workspaces/:id/usage # Workspace usage
POST   /admin/workspaces/:id/suspend  # Suspend workspace
GET    /admin/analytics            # Platform-wide analytics
```

---

## 💡 Best Practices

1. **Always filter by workspaceId** - Use registry's `tenantField`
2. **Check limits before operations** - Use hooks
3. **Log everything** - Audit trail per workspace
4. **Test isolation** - Ensure no cross-tenant leaks
5. **Monitor usage** - Track API calls, storage

---

## 📖 Related Documentation

- [Multi-Tenant Patterns](../../docs/MULTI_TENANT_GUIDE.md)
- [Subscription Management](../../docs/SUBSCRIPTION_GUIDE.md)
- [Security Best Practices](../../docs/SECURITY_GUIDE.md)

---

**Production-ready multi-tenant architecture! Use as template for your SaaS. 🏢**

