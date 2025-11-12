/**
 * Marketplace Preset (E-commerce)
 * 
 * Models: User, Product, Order
 * Features: Inventory, orders, payments (Stripe)
 */

export const MARKETPLACE_PRESET_SCHEMA = `
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  role      String   @default("user")
  
  orders    Order[]
  
  createdAt DateTime @default(now())
}

model Product {
  id          String   @id @default(cuid())
  /// @ui:text(label="Product Name")
  name        String
  /// @ui:textarea(label="Description")
  description String?
  /// @ui:currency(label="Price")
  price       Float
  /// @ui:number(label="Inventory")
  inventory   Int      @default(0)
  /// @ui:image(label="Product Image")
  imageUrl    String?
  isPublic    Boolean  @default(true)
  
  vendorId    String
  vendor      User     @relation(fields: [vendorId], references: [id])
  
  orderItems  OrderItem[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Order {
  id          String   @id @default(cuid())
  /// @ui:select(label="Status", options=["pending","paid","shipped","delivered"])
  status      String   @default("pending")
  /// @ui:currency(label="Total", readOnly=true)
  total       Float
  
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  
  items       OrderItem[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model OrderItem {
  id        String  @id @default(cuid())
  quantity  Int
  price     Float
  
  orderId   String
  order     Order   @relation(fields: [orderId], references: [id])
  
  productId String
  product   Product @relation(fields: [productId], references: [id])
}
`.trim()

export const MARKETPLACE_PRESET_APP_CONFIG = {
  name: "Marketplace",
  features: {
    auth: true,
    uploads: false,
    payments: true
  },
  pages: {
    Product: {
      list: {
        columns: ["imageUrl", "name", "price", "inventory", "vendor.name"]
      },
      detail: true,
      form: {
        fields: ["name", "description", "price", "inventory", "imageUrl"]
      }
    },
    Order: {
      list: {
        columns: ["user.name", "total", "status", "createdAt"]
      },
      detail: true,
      form: false
    },
    User: {
      list: true,
      detail: true,
      form: {
        fields: ["name", "email"]
      }
    }
  }
}

