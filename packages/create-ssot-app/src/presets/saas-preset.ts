/**
 * SaaS Preset (Multi-tenant Application)
 * 
 * Models: Org, User, Subscription
 * Features: Multi-tenancy, subscriptions, billing
 */

export const SAAS_PRESET_SCHEMA = `
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Org {
  id            String   @id @default(cuid())
  /// @ui:text(label="Organization Name")
  name          String
  /// @ui:select(label="Plan", options=["free","pro","enterprise"])
  plan          String   @default("free")
  
  users         User[]
  subscriptions Subscription[]
  
  createdAt     DateTime @default(now())
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  role      String   @default("member")
  
  orgId     String
  org       Org      @relation(fields: [orgId], references: [id])
  
  createdAt DateTime @default(now())
}

model Subscription {
  id              String   @id @default(cuid())
  /// @ui:select(label="Status", options=["active","canceled","past_due"])
  status          String   @default("active")
  /// @ui:currency(label="Amount")
  amount          Float
  /// @ui:select(label="Interval", options=["month","year"])
  interval        String   @default("month")
  stripeId        String?
  
  orgId           String
  org             Org      @relation(fields: [orgId], references: [id])
  
  currentPeriodStart DateTime
  currentPeriodEnd   DateTime
  createdAt          DateTime @default(now())
}
`.trim()

export const SAAS_PRESET_APP_CONFIG = {
  name: "SaaS Platform",
  features: {
    auth: true,
    uploads: false,
    payments: true
  },
  pages: {
    Org: {
      list: {
        columns: ["name", "plan", "createdAt"]
      },
      detail: true,
      form: {
        fields: ["name", "plan"]
      }
    },
    User: {
      list: {
        columns: ["name", "email", "org.name", "role", "createdAt"]
      },
      detail: true,
      form: {
        fields: ["name", "email", "role"]
      }
    },
    Subscription: {
      list: {
        columns: ["org.name", "status", "amount", "interval", "currentPeriodEnd"]
      },
      detail: true,
      form: false
    }
  }
}

