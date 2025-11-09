# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Communication Rules

- **Always respond in Korean (한국어)** when working on this project
- This is a Korean application (Saucerer - 소스 레시피 관리), so all communication should be in Korean

## Project Structure

This is a **monorepo** project with separate backend and frontend:

```
saucerer/
├── backend/          # Fastify REST API server
├── frontend/         # Next.js 15 client
└── package.json      # Workspace root
```

## Development Commands

### Monorepo Commands (run from root)
- `npm run dev` - Run frontend + backend concurrently
- `npm run dev:frontend` - Run frontend only
- `npm run dev:backend` - Run backend only
- `npm run build` - Build both projects
- `npm start` - Start production backend

### Backend Commands (run from backend/)
- `npm run dev` - Start development server with tsx watch
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Start production server

### Frontend Commands (run from frontend/)
- `npm run dev` - Start Next.js development server with Turbopack
- `npm run build` - Build production application
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Architecture Overview

Saucerer is a **cost-efficient** monorepo application for managing sauce recipes, built with:

### Backend
- **Framework**: Fastify 5 (TypeScript)
- **Database**: Neon PostgreSQL (Serverless, ~$0/month)
- **Authentication**: Google OAuth2 + JWT
- **Image Storage**: Cloudflare R2 (~$0.15/month)
- **Image Processing**: Sharp (WebP optimization, 97% size reduction)

### Frontend
- **Framework**: Next.js 15 with App Router
- **Styling**: TailwindCSS v4
- **Icons**: Lucide React
- **API Client**: Custom client in `frontend/src/lib/api.ts`
- **Language**: Korean (ko locale)

## Database Schema

Four main tables with proper foreign key constraints:

1. **users** - User accounts (id, email, name, google_id, timestamps)
2. **sauces** - Recipe containers (id, name, user_id, timestamps)
3. **ingredients** - Recipe components (id, sauce_id, name, amount, unit, created_at)
4. **cooking_records** - Cooking attempts (id, sauce_id, user_id, photo_url, notes, rating, ingredient_amounts as JSONB, created_at)

All user-specific tables are protected via application-level authorization using `user_id` checks in API routes.

## Application Structure

### Authentication Flow
- **Login**: Google OAuth2 at `/auth/google`
- **Callback**: `/auth/google/callback` → sets JWT cookie → redirects to `/sauces`
- **Session**: JWT token stored in HTTP-only cookie
- **Logout**: POST `/auth/logout` → clears cookie

### Frontend Pages
- **Root (`/`)**: Login page with Google OAuth button
- **Sauces List (`/sauces`)**: Main app with sauce listing
- **New Sauce (`/sauces/new`)**: Create sauce with ingredients
- **Sauce Detail (`/sauces/[id]`)**: View/edit sauce, add cooking records with image upload
- **Records (`/sauces/[id]/records`)**: Full list of cooking records

### API Integration

Frontend uses `@/lib/api` client (NOT Supabase):

```typescript
import { api } from '@/lib/api'

// Authentication
api.auth.loginWithGoogle()
api.auth.getCurrentUser()
api.auth.logout()

// Sauces
api.sauces.list()
api.sauces.get(id)
api.sauces.create(data)
api.sauces.update(id, data)
api.sauces.delete(id)

// Ingredients
api.ingredients.list(sauceId)
api.ingredients.create(data)
api.ingredients.update(id, data)
api.ingredients.delete(id)

// Cooking Records
api.cookingRecords.list(sauceId, limit?)
api.cookingRecords.create(data)
api.cookingRecords.update(id, data)
api.cookingRecords.delete(id)

// Image Upload
api.upload.image(file) // Returns { data: { url, thumbnailUrl }, error }
```

### Backend API Structure

Routes are in `backend/src/routes/`:
- **auth.ts** - OAuth2 + JWT authentication
- **sauces.ts** - Sauce CRUD operations
- **ingredients.ts** - Ingredient CRUD operations
- **cooking-records.ts** - Cooking record CRUD operations
- **upload.ts** - Image upload with Sharp optimization

All protected routes use `authenticate` middleware from `backend/src/middleware/auth.ts`.

## Environment Variables

### Backend (`backend/.env`)
- `DATABASE_URL` - Neon PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT signing
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` - OAuth2 credentials
- `OAUTH_CALLBACK_URL` - OAuth callback URL
- `R2_*` - Cloudflare R2 credentials
- `FRONTEND_URL` - Frontend URL for CORS

### Frontend (`frontend/.env.local`)
- `NEXT_PUBLIC_API_URL` - Backend API URL (default: http://localhost:3001)

## Image Upload Feature

When users upload images:
1. Frontend sends file to `/api/upload/image` (multipart/form-data)
2. Backend validates file type and size
3. Sharp optimizes image (WebP, max 1920px, 80% quality)
4. Creates thumbnail (300x300px, WebP, 75% quality)
5. Uploads both to Cloudflare R2
6. Returns public URLs

Average compression: **97% size reduction** from original.

## UI Components

Custom components in `frontend/src/components/ui/`:
- **Button** - With variants (primary, secondary, outline) and sizes (sm, md, lg)
- **Input** - Standard input with consistent styling

## Code Patterns

### API Client Pattern
```typescript
const { data, error } = await api.sauces.list()
if (error) {
  console.error(error)
  return
}
// use data
```

### Authentication Check
```typescript
useEffect(() => {
  checkUser()
}, [])

const checkUser = async () => {
  const { data, error } = await api.auth.getCurrentUser()
  if (error || !data) {
    window.location.href = '/'
    return
  }
  setUser(data)
}
```

### Image Upload
```typescript
const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0]
  if (!file) return

  setIsUploading(true)
  const { data, error } = await api.upload.image(file)
  setIsUploading(false)

  if (error) {
    alert('이미지 업로드 실패')
    return
  }

  setPhotoUrl(data.url)
}
```

## Important Notes

- ⚠️ **DO NOT use Supabase client** - Use `api` from `@/lib/api` instead
- ⚠️ **Backend uses `postgres` package** - NOT `@fastify/postgres`
- ✅ **All responses should be in Korean**
- ✅ **Image uploads are automatically optimized**
- ✅ **JWT tokens are HTTP-only cookies** for security
- ✅ **CORS is configured** for frontend-backend communication

## Testing Locally

1. Set up Neon database and run `backend/schema.sql`
2. Configure Google OAuth2 credentials
3. Set up Cloudflare R2 bucket (optional for image upload)
4. Create `.env` files in backend and frontend
5. Run `npm install` in root
6. Run `npm run dev` to start both servers
7. Frontend: http://localhost:3000
8. Backend: http://localhost:3001
