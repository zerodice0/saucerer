# Saucerer

[한국어](README.ko.md) | English

A web application for managing sauce recipes and cooking records.

## Features

- Create, edit, and delete sauce recipes
- Manage ingredients (name, amount, unit)
- Add cooking records (photos, notes, ratings, actual ingredient amounts)
- User-specific data management (authentication required)

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Styling**: TailwindCSS v4
- **Icons**: Lucide React
- **Language**: TypeScript

## Setup

1. Clone the project and install dependencies:
```bash
git clone <repository-url>
cd saucerer
npm install
```

2. Environment variables:
Create a `.env.local` file and set the following variables:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. Run the development server:
```bash
npm run dev --turbopack
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Development Commands

- `npm run dev --turbopack` - Start development server with Turbo
- `npm run build` - Build production application
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Database Schema

### Tables

1. **sauces** - Sauce recipes
   - `id`, `name`, `user_id`, `created_at`, `updated_at`

2. **ingredients** - Recipe ingredients
   - `id`, `sauce_id`, `name`, `amount`, `unit`, `created_at`

3. **cooking_records** - Cooking attempts
   - `id`, `sauce_id`, `user_id`, `photo_url`, `notes`, `rating`, `ingredient_amounts` (JSONB), `created_at`

All tables use Row Level Security (RLS) to isolate data by user.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Login page (home)
│   ├── layout.tsx         # Root layout
│   └── sauces/            # Sauce-related pages
│       ├── page.tsx       # Sauce list
│       ├── new/           # Create new sauce
│       └── [id]/          # Individual sauce pages
│           ├── page.tsx   # Sauce detail/edit
│           └── records/   # Cooking records
├── components/            # Reusable components
│   ├── LoginForm.tsx     # Login form
│   └── ui/               # UI components
└── lib/
    └── supabase.ts       # Supabase client setup
```

## Usage

1. Sign up or log in
2. Create sauce recipes
3. Add/edit ingredients
4. Add cooking records after cooking (photos, notes, ratings, etc.)

## Deployment

Recommended deployment on Vercel:

1. Connect project to [Vercel](https://vercel.com)
2. Set environment variables
3. Automatic deployment completed
