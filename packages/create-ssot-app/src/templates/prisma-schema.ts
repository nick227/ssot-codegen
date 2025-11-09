/**
 * Generate Prisma schema with example models
 */

import type { ProjectConfig } from '../prompts.js'

export function generatePrismaSchema(config: ProjectConfig): string {
  const dbProvider = config.database
  const dbUrl = getDatabaseUrl(config.database)

  let schema = `// Prisma Schema
// Learn more: https://pris.ly/d/prisma-schema

datasource db {
  provider = "${dbProvider}"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

`

  if (config.includeExamples) {
    schema += `// Example Models
// Edit these or add your own models

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  posts     Post[]
`

    if (config.includeAuth) {
      schema += `  password  String   // Hash this in production!\n`
      schema += `  role      Role     @default(USER)\n`
    }

    schema += `}

model Post {
  id        Int      @id @default(autoincrement())
  title     String
  content   String?
  published Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  authorId  Int
  author    User     @relation(fields: [authorId], references: [id])
}
`

    if (config.includeAuth) {
      schema += `
enum Role {
  USER
  ADMIN
}
`
    }
  } else {
    schema += `// Add your models here
// Example:
//
// model Product {
//   id          Int      @id @default(autoincrement())
//   name        String
//   description String?
//   price       Decimal  @db.Decimal(10, 2)
//   createdAt   DateTime @default(now())
// }
`
  }

  return schema
}

function getDatabaseUrl(database: string): string {
  switch (database) {
    case 'postgresql':
      return 'postgresql://user:password@localhost:5432/mydb'
    case 'mysql':
      return 'mysql://user:password@localhost:3306/mydb'
    case 'sqlite':
      return 'file:./dev.db'
    default:
      return 'postgresql://user:password@localhost:5432/mydb'
  }
}

