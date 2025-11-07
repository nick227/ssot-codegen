/**
 * CI/CD Template Generator
 * 
 * Generates GitHub Actions workflows and other CI/CD configurations
 */

/**
 * Generate GitHub Actions CI workflow
 */
export function generateGitHubActionsCI(): string {
  return `name: CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    name: Test
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Generate Prisma Client
        run: npx prisma generate
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test_db

      - name: Run database migrations
        run: npx prisma db push --skip-generate
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test_db

      - name: Run linter
        run: npm run lint

      - name: Run tests
        run: npm test -- --coverage
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test_db
          NODE_ENV: test

      - name: Upload coverage reports
        uses: codecov/codecov-action@v4
        if: always()
        with:
          token: \${{ secrets.CODECOV_TOKEN }}
          files: ./coverage/coverage-final.json
          fail_ci_if_error: false

  build:
    name: Build
    runs-on: ubuntu-latest
    needs: test
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Generate Prisma Client
        run: npx prisma generate

      - name: Build application
        run: npm run build

      - name: Check build artifacts
        run: ls -la dist/
`
}

/**
 * Generate GitHub Actions deployment workflow
 */
export function generateGitHubActionsDeploy(): string {
  return `name: Deploy to Production

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  deploy:
    name: Deploy
    runs-on: ubuntu-latest
    environment: production
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Generate Prisma Client
        run: npx prisma generate

      - name: Build application
        run: npm run build
        env:
          NODE_ENV: production

      - name: Run database migrations
        run: npx prisma migrate deploy
        env:
          DATABASE_URL: \${{ secrets.DATABASE_URL }}

      # Add your deployment steps here
      # Examples:
      # - Deploy to AWS, Azure, GCP
      # - Update Docker container
      # - Deploy to Vercel, Railway, Render
      
      - name: Deploy
        run: echo "Add your deployment commands here"
        # Example for Railway:
        # run: railway up
        # env:
        #   RAILWAY_TOKEN: \${{ secrets.RAILWAY_TOKEN }}
`
}

/**
 * Generate Docker configuration
 */
export function generateDockerfile(): string {
  return `# Multi-stage build for production
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Copy only production dependencies
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs

EXPOSE 3000

# Run migrations and start server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
`
}

/**
 * Generate docker-compose for local development
 */
export function generateDockerCompose(): string {
  return `version: '3.8'

services:
  # Database
  postgres:
    image: postgres:16-alpine
    container_name: dev-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: dev
      POSTGRES_PASSWORD: dev
      POSTGRES_DB: dev_db
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U dev"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Application (optional - for containerized development)
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: dev-app
    restart: unless-stopped
    environment:
      DATABASE_URL: postgresql://dev:dev@postgres:5432/dev_db
      NODE_ENV: development
      PORT: 3000
    ports:
      - "3000:3000"
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - ./src:/app/src
      - ./prisma:/app/prisma
    command: npm run dev

volumes:
  postgres-data:
`
}

/**
 * Generate .dockerignore
 */
export function generateDockerIgnore(): string {
  return `# Dependencies
node_modules/
npm-debug.log*

# Environment
.env
.env.*

# Build
dist/
build/

# Generated
gen/

# Tests
coverage/
*.test.ts
*.spec.ts
tests/

# IDE
.vscode/
.idea/

# Git
.git/
.gitignore

# Docs
*.md
!README.md

# CI
.github/
`
}

/**
 * Generate CI/CD README
 */
export function generateCIReadme(): string {
  return `# CI/CD

This directory contains CI/CD configurations for automated testing and deployment.

## GitHub Actions

### Workflows

1. **ci.yml** - Continuous Integration
   - Runs on every push and pull request
   - Executes tests with coverage
   - Runs linter
   - Builds application

2. **deploy.yml** - Deployment
   - Deploys to production on push to \`main\`
   - Runs database migrations
   - Can be triggered manually

### Setup

1. **Database for Tests**: Uses PostgreSQL service container
2. **Secrets**: Configure in GitHub repository settings:
   - \`DATABASE_URL\` - Production database URL
   - \`CODECOV_TOKEN\` - (Optional) For coverage reports
   - Add deployment-specific secrets as needed

### Running Locally

\`\`\`bash
# Simulate CI build
npm ci
npm run lint
npm test
npm run build
\`\`\`

## Docker

### Development

\`\`\`bash
# Start database
docker-compose up postgres

# Or start full stack
docker-compose up
\`\`\`

### Production

\`\`\`bash
# Build image
docker build -t my-api .

# Run container
docker run -p 3000:3000 \\
  -e DATABASE_URL="your-database-url" \\
  my-api
\`\`\`

### Multi-arch Build

\`\`\`bash
# Build for multiple platforms
docker buildx build \\
  --platform linux/amd/64,linux/arm64 \\
  -t my-api:latest \\
  --push .
\`\`\`

## Deployment Platforms

### Railway

\`\`\`bash
railway login
railway init
railway up
\`\`\`

### Render

1. Connect GitHub repository
2. Set environment variables
3. Deploy automatically on push

### Vercel/Netlify

Best for serverless deployments. May require adapter.

### AWS/Azure/GCP

See platform-specific documentation for deployment steps.

## Environment Variables

Required for production:

\`\`\`env
DATABASE_URL=postgresql://...
NODE_ENV=production
PORT=3000
\`\`\`

See \`.env.example\` for complete list.
`
}

