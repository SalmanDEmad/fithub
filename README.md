# FitHub

Fitness tracking platform with mobile, web, and backend services for gym check-ins, streak management, and goal tracking.

## 1. Architecture

Monorepo structure with three applications and shared packages:

```
apps/
  api/              NestJS REST API
  mobile/           React Native + Expo
  web/              Next.js dashboard
packages/
  api-client/       Shared API client
  shared/           Utilities and i18n
  tokens/           Design tokens
  validation/       Validation schemas
```

## 2. Technology Stack

**Mobile**: React Native, Expo, Expo Router, @tanstack/react-query  
**Web**: Next.js, Tailwind CSS, TypeScript  
**API**: NestJS, Prisma ORM, PostgreSQL  
**Infrastructure**: Supabase, Docker

## 3. Prerequisites

- Node.js 18+
- Yarn 4+
- Docker & Docker Compose
- Expo CLI

## 4. Environment Setup

Each application requires specific environment variables. Get these from your Supabase project and services:

**Mobile (apps/mobile/.env.local)**
```
EXPO_PUBLIC_SUPABASE_URL=<your-supabase-url>
EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
```

**Web (apps/web/.env.local)**
```
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
NEXT_PUBLIC_API_URL=http://localhost:3000
```

**API (apps/api/.env.local)**
```
DATABASE_URL=postgresql://user:password@localhost:5432/fithub
SUPABASE_URL=<your-supabase-url>
SUPABASE_KEY=<your-supabase-key>
SUPABASE_JWT_SECRET=<your-jwt-secret>
NODE_ENV=development
```

## 5. Supabase Configuration

1. Create Supabase project at supabase.com
2. Copy project URL and API keys
3. For local development, run Supabase with Docker:
   ```bash
   cd supabase
   docker-compose up
   ```
4. Access local Supabase studio at http://localhost:54323

## 6. Installation

```bash
git clone https://github.com/yourusername/fithub.git
cd fithub
yarn install
```

Copy environment templates:
```bash
cp apps/mobile/.env.example apps/mobile/.env.local
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env.local
```

Fill in actual values from your Supabase project or local setup.

## 7. Database Setup

```bash
# Start Supabase (if using Docker)
cd supabase
docker-compose up

# In another terminal, run migrations
cd apps/api
yarn prisma migrate deploy
```

## 8. Development

Start services in separate terminals:

```bash
# API (http://localhost:3000)
yarn api:dev

# Web (http://localhost:3000)
yarn web:dev

# Mobile
cd apps/mobile && npx expo start
```

## 9. Project Features

**Mobile App**
- User authentication
- QR code gym check-in
- Weekly goal tracking
- Streak management
- Check-in history
- Profile management

**Web Dashboard**
- Gym management
- Member administration
- QR code generation
- Analytics
- Settings

**API**
- REST endpoints
- JWT authentication
- Member tracking
- Streak calculation
- Push notifications

## 10. Key Scripts

```bash
yarn install:all          # Install all dependencies
yarn build:packages       # Build shared packages
yarn api:dev             # Start API in dev mode
yarn web:dev             # Start web in dev mode
yarn mobile:dev          # Start mobile
yarn lint                # Run linter
yarn format              # Format code
```

## 11. Database Management

```bash
cd apps/api

# Create migration
yarn prisma migrate dev --name migration_name

# Apply migrations
yarn prisma migrate deploy

# Open database studio
yarn prisma studio
```

## 12. API Documentation

Swagger documentation available at: `http://localhost:3000/api/docs`

Main endpoints:
- `POST /auth/login`
- `POST /auth/signup`
- `GET /members/me`
- `POST /checkins`
- `GET /checkins/history`
- `GET /goals`

## 13. Contributing

1. Fork repository
2. Create feature branch: `git checkout -b feature/description`
3. Make changes following existing code style
4. Commit with descriptive messages
5. Push and open Pull Request

Code standards:
- TypeScript strict mode required
- ESLint and Prettier configuration enforced
- Tests required for new features
- Update documentation accordingly

See CONTRIBUTING.md for detailed guidelines.

## 14. Testing

```bash
# API tests
cd apps/api && yarn test

# Web tests
cd apps/web && yarn test
```

## 15. Deployment

- Mobile: Expo EAS Build
- Web: Vercel, Netlify, or self-hosted
- API: Docker container
- Database: Supabase managed PostgreSQL

## 16. Troubleshooting

**Supabase connection fails**
- Verify DATABASE_URL is correct
- Check Docker is running (if using local Supabase)
- Ensure migrations have been applied: `yarn prisma migrate deploy`

**Mobile app won't load**
- Clear Metro cache: `yarn start --reset-cache`
- Delete `node_modules` and reinstall: `yarn install`
- Verify all env variables are set in `.env.local`

**API port already in use**
- Change port in `apps/api/src/main.ts`
- Or kill process: `lsof -ti:3000 | xargs kill -9`

**Environment variables not loading**
- Ensure `.env.local` files exist (not `.env`)
- Restart dev servers after changing env files
- Check file permissions

## 17. License

MIT License - see LICENSE file for details.

## 18. Support

For issues or questions:
- Open GitHub Issue
- Create Discussion
- Contact maintainers

# fithub
