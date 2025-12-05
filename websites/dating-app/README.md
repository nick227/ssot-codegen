# Dating App Backend

A comprehensive dating app backend system combining traditional profile-based matching with sophisticated personality test-based compatibility scoring.

## Overview

This project implements a full-featured dating app backend with:
- **Tinder-style swiping mechanics** for quick matching
- **Multi-category personality tests** for deeper compatibility assessment
- **Background job-based compatibility scoring** for efficient matching
- **Comprehensive user profiles** with photos, preferences, and lifestyle data

## Key Features

### Core Matching System
- Swipe-based discovery (like/pass/super like)
- Mutual like matching
- Discovery queue algorithm
- Match management

### Personality Test System
- Multiple test categories (Big Five, Love Languages, Attachment Style, etc.)
- Flexible question types (multiple choice, Likert scale, ranking)
- Test completion tracking
- Score calculation and storage

### Compatibility Scoring
- Multi-factor compatibility calculation
- Category-based scoring breakdowns
- Background job processing
- Real-time and batch updates

### User Profiles
- Comprehensive profile information
- Photo management with moderation
- Preferences and filters
- Profile completeness tracking

## Documentation

- **[FEATURES.md](./FEATURES.md)** - Complete feature specification and requirements
- **[SCHEMA_REVIEW_COMPLETE.md](./SCHEMA_REVIEW_COMPLETE.md)** - Schema compliance review
- **[SERVICE_GENERATION_GUIDE.md](./SERVICE_GENERATION_GUIDE.md)** - Service annotation guide
- **[NEXT_STEPS.md](./NEXT_STEPS.md)** - Implementation next steps
- **[TECHNICAL_SPECIFICATIONS.md](./TECHNICAL_SPECIFICATIONS.md)** - Technical details and formulas

## Status

✅ **Schema Complete**: Prisma schema validated and ready  
✅ **Configuration Ready**: SSOT config file created  
⏭️ **Ready for Code Generation**: See NEXT_STEPS.md

## Database

- **Provider**: MySQL
- **Database Name**: `dating-app`
- **Schema**: `prisma/schema.prisma`

## Quick Start

1. Create MySQL database: `CREATE DATABASE \`dating-app\`;`
2. Set `DATABASE_URL` in `.env`
3. Generate Prisma Client: `npx prisma generate`
4. Run migrations: `npx prisma migrate dev --name init`
5. Generate SSOT code: See NEXT_STEPS.md

