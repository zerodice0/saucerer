# Saucerer

[한국어](README.ko.md) | English

A web application for managing sauce recipes and cooking records with cost-efficient cloud infrastructure.

## 🏗️ Architecture

This is a **monorepo** project with separate backend and frontend:

```
saucerer/
├── backend/          # Fastify REST API server
│   ├── src/
│   │   ├── routes/   # API endpoints
│   │   ├── config/   # Configuration
│   │   ├── utils/    # Utilities (image optimization)
│   │   └── index.ts  # Entry point
│   └── schema.sql    # PostgreSQL schema
├── frontend/         # Next.js 15 client
│   ├── src/
│   │   ├── app/      # App Router pages
│   │   ├── components/ # React components
│   │   └── lib/      # API client
│   └── package.json
└── package.json      # Workspace root
```

## ✨ Features

- **Authentication**: Google OAuth2 login with JWT
- **Recipe Management**: Create, edit, and delete sauce recipes
- **Ingredient Tracking**: Manage ingredients with precise measurements
- **Cooking Records**: Track cooking attempts with photos, ratings, and notes
- **Image Optimization**: Automatic WebP conversion with 97% size reduction
- **Cost-Efficient**: ~$0.15/month infrastructure costs

## 🚀 Tech Stack

### Backend
- **Framework**: Fastify 5
- **Database**: Neon PostgreSQL (Serverless)
- **Authentication**: Google OAuth2 + JWT
- **Image Storage**: Cloudflare R2
- **Image Processing**: Sharp (WebP optimization)
- **Language**: TypeScript

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Styling**: TailwindCSS v4
- **Icons**: Lucide React
- **Language**: TypeScript

## 💰 Infrastructure Costs

| Service | Purpose | Estimated Monthly Cost |
|---------|---------|----------------------|
| Neon | PostgreSQL Database | $0 (Free tier) |
| Cloudflare R2 | Image Storage | ~$0.15 (10GB) |
| **Total** | | **~$0.15/month** |

## 📦 Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd saucerer
npm install
```

### 2. Environment Variables

#### Backend (`backend/.env`)

```bash
# Server
PORT=3001
NODE_ENV=development
JWT_SECRET=your-secret-key-change-this-in-production

# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://user:password@host/database?sslmode=require

# Google OAuth2
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
OAUTH_CALLBACK_URL=http://localhost:3001/auth/google/callback

# Cloudflare R2
R2_ACCOUNT_ID=your-r2-account-id
R2_ACCESS_KEY_ID=your-r2-access-key
R2_SECRET_ACCESS_KEY=your-r2-secret-key
R2_BUCKET_NAME=saucerer-images
R2_PUBLIC_URL=https://your-bucket.r2.dev

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

#### Frontend (`frontend/.env.local`)

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 3. Database Setup

Create database on Neon and apply schema:

```bash
psql $DATABASE_URL -f backend/schema.sql
```

### 4. Google OAuth2 Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Navigate to **APIs & Services** > **Credentials**
4. Create **OAuth 2.0 Client ID**
5. Add authorized redirect URIs:
   - `http://localhost:3001/auth/google/callback` (development)
   - `https://your-domain.com/auth/google/callback` (production)
6. Copy Client ID and Secret to `.env`

### 5. Cloudflare R2 Setup

1. Login to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Go to **R2** > **Create bucket**
3. Enter bucket name (e.g., `saucerer-images`)
4. Create **R2 API Token** with `Object Read & Write` permissions
5. Copy Account ID, Access Key, and Secret Key to `.env`
6. Enable **Public Access** in bucket settings (optional)

### 6. Run Development Servers

```bash
# Run all servers
npm run dev

# Or run individually
npm run dev:frontend  # http://localhost:3000
npm run dev:backend   # http://localhost:3001
```

## 🛠️ Development Commands

```bash
npm run dev              # Run frontend + backend
npm run dev:frontend     # Run frontend only
npm run dev:backend      # Run backend only
npm run build            # Build both projects
npm start                # Start production server
```

## 📚 API Endpoints

### Authentication
```
GET  /auth/google              # Start Google login
GET  /auth/google/callback     # OAuth callback
POST /auth/logout              # Logout
GET  /auth/me                  # Get current user
```

### Sauces
```
GET    /api/sauces             # List sauces
GET    /api/sauces/:id         # Get sauce with ingredients
POST   /api/sauces             # Create sauce
PUT    /api/sauces/:id         # Update sauce
DELETE /api/sauces/:id         # Delete sauce
```

### Ingredients
```
GET    /api/ingredients/sauce/:sauceId  # List ingredients
POST   /api/ingredients                 # Add ingredient
PUT    /api/ingredients/:id             # Update ingredient
DELETE /api/ingredients/:id             # Delete ingredient
```

### Cooking Records
```
GET    /api/cooking-records/sauce/:sauceId  # List records
GET    /api/cooking-records/:id             # Get record
POST   /api/cooking-records                 # Create record
PUT    /api/cooking-records/:id             # Update record
DELETE /api/cooking-records/:id             # Delete record
```

### Upload
```
POST /api/upload/image         # Upload image (multipart/form-data)
```

## 📖 Database Schema

### users
- `id` (UUID, PK)
- `email` (VARCHAR, UNIQUE)
- `name` (VARCHAR)
- `google_id` (VARCHAR, UNIQUE)
- `created_at`, `updated_at`

### sauces
- `id` (UUID, PK)
- `name` (VARCHAR)
- `user_id` (UUID, FK → users)
- `created_at`, `updated_at`

### ingredients
- `id` (UUID, PK)
- `sauce_id` (UUID, FK → sauces, CASCADE)
- `name` (VARCHAR)
- `amount` (DECIMAL)
- `unit` (VARCHAR, default: '큰술')
- `created_at`

### cooking_records
- `id` (UUID, PK)
- `sauce_id` (UUID, FK → sauces, CASCADE)
- `user_id` (UUID, FK → users, CASCADE)
- `photo_url` (TEXT)
- `notes` (TEXT)
- `rating` (INTEGER, 1-5)
- `ingredient_amounts` (JSONB)
- `created_at`

## 🚢 Production Deployment

### Backend
```bash
cd backend
npm run build
npm start
```

### Frontend
```bash
cd frontend
npm run build
npm start
```

### Environment Checklist
- [ ] `DATABASE_URL` (Neon connection string)
- [ ] `JWT_SECRET` (random string)
- [ ] `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`
- [ ] `R2_*` (Cloudflare R2 credentials)
- [ ] `OAUTH_CALLBACK_URL` (production URL)
- [ ] `FRONTEND_URL` (production URL)

## 📝 License

MIT License

---

Made with ❤️ using Fastify, Next.js, and modern cloud infrastructure
