// Saucerer API Client
// Fastify 백엔드와 통신하는 클라이언트

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// API 타입 정의
export interface User {
  id: string;
  email: string;
  name?: string;
  created_at: string;
}

export interface Sauce {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface Ingredient {
  id: string;
  sauce_id: string;
  name: string;
  amount: number;
  unit: string;
  created_at: string;
}

export interface CookingRecord {
  id: string;
  sauce_id: string;
  user_id: string;
  photo_url?: string | null;
  notes?: string | null;
  rating?: number | null;
  ingredient_amounts: Record<string, number>;
  created_at: string;
}

export interface SauceWithIngredients extends Sauce {
  ingredients: Ingredient[];
}

// API 클라이언트 클래스
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{ data: T | null; error: Error | null }> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        credentials: 'include', // 쿠키 포함
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  // Auth API
  auth = {
    loginWithGoogle: () => {
      window.location.href = `${this.baseUrl}/auth/google`;
    },

    logout: async () => {
      return this.request('/auth/logout', { method: 'POST' });
    },

    getCurrentUser: async () => {
      return this.request<User>('/auth/me');
    },
  };

  // Sauces API
  sauces = {
    list: async () => {
      return this.request<Sauce[]>('/api/sauces');
    },

    get: async (id: string) => {
      return this.request<SauceWithIngredients>(`/api/sauces/${id}`);
    },

    create: async (data: { name: string; ingredients?: Array<{ name: string; amount: number; unit: string }> }) => {
      return this.request<Sauce>('/api/sauces', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    update: async (id: string, data: { name: string }) => {
      return this.request<Sauce>(`/api/sauces/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },

    delete: async (id: string) => {
      return this.request<{ success: boolean }>(`/api/sauces/${id}`, {
        method: 'DELETE',
      });
    },
  };

  // Ingredients API
  ingredients = {
    list: async (sauceId: string) => {
      return this.request<Ingredient[]>(`/api/ingredients/sauce/${sauceId}`);
    },

    create: async (data: { sauce_id: string; name: string; amount: number; unit?: string }) => {
      return this.request<Ingredient>('/api/ingredients', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    update: async (id: string, data: { name?: string; amount?: number; unit?: string }) => {
      return this.request<Ingredient>(`/api/ingredients/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },

    delete: async (id: string) => {
      return this.request<{ success: boolean }>(`/api/ingredients/${id}`, {
        method: 'DELETE',
      });
    },
  };

  // Cooking Records API
  cookingRecords = {
    list: async (sauceId: string, limit?: number) => {
      const query = limit ? `?limit=${limit}` : '';
      return this.request<CookingRecord[]>(`/api/cooking-records/sauce/${sauceId}${query}`);
    },

    get: async (id: string) => {
      return this.request<CookingRecord>(`/api/cooking-records/${id}`);
    },

    create: async (data: {
      sauce_id: string;
      photo_url?: string;
      notes?: string;
      rating?: number;
      ingredient_amounts: Record<string, number>;
    }) => {
      return this.request<CookingRecord>('/api/cooking-records', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    update: async (id: string, data: {
      photo_url?: string;
      notes?: string;
      rating?: number;
      ingredient_amounts?: Record<string, number>;
    }) => {
      return this.request<CookingRecord>(`/api/cooking-records/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },

    delete: async (id: string) => {
      return this.request<{ success: boolean }>(`/api/cooking-records/${id}`, {
        method: 'DELETE',
      });
    },
  };

  // Upload API
  upload = {
    image: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch(`${this.baseUrl}/api/upload/image`, {
          method: 'POST',
          credentials: 'include',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: response.statusText }));
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const data = await response.json();
        return { data, error: null };
      } catch (error) {
        return { data: null, error: error as Error };
      }
    },
  };
}

// 싱글톤 인스턴스
export const api = new ApiClient(API_BASE_URL);

// 레거시 호환성을 위한 타입 (기존 Database 타입 유지)
export type Database = {
  public: {
    Tables: {
      sauces: {
        Row: Sauce;
        Insert: Omit<Sauce, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Sauce, 'id'>>;
      };
      ingredients: {
        Row: Ingredient;
        Insert: Omit<Ingredient, 'id' | 'created_at'>;
        Update: Partial<Omit<Ingredient, 'id'>>;
      };
      cooking_records: {
        Row: CookingRecord;
        Insert: Omit<CookingRecord, 'id' | 'created_at'>;
        Update: Partial<Omit<CookingRecord, 'id'>>;
      };
    };
  };
};
