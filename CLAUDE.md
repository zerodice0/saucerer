# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Communication Rules

- **Always respond in Korean (한국어)** when working on this project
- This is a Korean application (Saucerer - 소스 레시피 관리), so all communication should be in Korean

## Development Commands

- `npm run dev --turbopack` - Start development server with Turbo
- `npm run build` - Build production application  
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Architecture Overview

Saucerer is a Next.js 15 application for managing sauce recipes, built with:

- **Framework**: Next.js 15 with App Router
- **Database**: Supabase with PostgreSQL 
- **Authentication**: Supabase Auth
- **Styling**: TailwindCSS v4
- **Icons**: Lucide React
- **Language**: Korean (ko locale)

### Database Schema

Three main tables with Row Level Security (RLS):

1. **sauces** - Recipe containers (name, user_id, timestamps)
2. **ingredients** - Recipe components (sauce_id, name, amount, unit) 
3. **cooking_records** - Cooking attempts (sauce_id, user_id, photo_url, notes, rating, ingredient_amounts as JSONB)

All tables are user-scoped via RLS policies using `auth.uid()`.

### Application Structure

- **Authentication**: Login/signup flow at root (`/`) redirects to `/sauces` on success
- **Main App**: Sauce listing at `/sauces` with CRUD operations
- **Recipe Management**: Individual sauce pages at `/sauces/[id]` with ingredients
- **Cooking Records**: Track cooking attempts at `/sauces/[id]/records`

### Supabase Integration

- Server-side rendering support via `@supabase/ssr`
- Client-side operations via `createSupabaseClient()` 
- Database types defined in `src/lib/supabase.ts`
- Environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### UI Components

Custom components in `src/components/ui/` (Button, Input) following consistent patterns with TailwindCSS styling.