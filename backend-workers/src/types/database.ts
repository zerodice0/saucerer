export interface User {
  id: string;
  email: string;
  name?: string;
  google_id?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Sauce {
  id: string;
  name: string;
  user_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface Ingredient {
  id: string;
  sauce_id: string;
  name: string;
  amount: number;
  unit: string;
  created_at: Date;
}

export interface CookingRecord {
  id: string;
  sauce_id: string;
  user_id: string;
  photo_url?: string;
  notes?: string;
  rating?: number;
  ingredient_amounts: Record<string, number>;
  created_at: Date;
}

export type InsertUser = Omit<User, 'id' | 'created_at' | 'updated_at'>;
export type InsertSauce = Omit<Sauce, 'id' | 'created_at' | 'updated_at'>;
export type InsertIngredient = Omit<Ingredient, 'id' | 'created_at'>;
export type InsertCookingRecord = Omit<CookingRecord, 'id' | 'created_at'>;
