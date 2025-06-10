import { createClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

export const supabase = typeof window !== 'undefined' ? createClient(supabaseUrl, supabaseAnonKey) : null

export function createSupabaseClient() {
  if (typeof window === 'undefined') {
    return null as unknown as ReturnType<typeof createBrowserClient>
  }
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

export type Database = {
  public: {
    Tables: {
      sauces: {
        Row: {
          id: string
          name: string
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      ingredients: {
        Row: {
          id: string
          sauce_id: string
          name: string
          amount: number
          unit: string
          created_at: string
        }
        Insert: {
          id?: string
          sauce_id: string
          name: string
          amount: number
          unit: string
          created_at?: string
        }
        Update: {
          id?: string
          sauce_id?: string
          name?: string
          amount?: number
          unit?: string
          created_at?: string
        }
      }
      cooking_records: {
        Row: {
          id: string
          sauce_id: string
          user_id: string
          photo_url: string | null
          notes: string | null
          rating: number | null
          ingredient_amounts: Record<string, number>
          created_at: string
        }
        Insert: {
          id?: string
          sauce_id: string
          user_id: string
          photo_url?: string | null
          notes?: string | null
          rating?: number | null
          ingredient_amounts: Record<string, number>
          created_at?: string
        }
        Update: {
          id?: string
          sauce_id?: string
          user_id?: string
          photo_url?: string | null
          notes?: string | null
          rating?: number | null
          ingredient_amounts?: Record<string, number>
          created_at?: string
        }
      }
    }
  }
}