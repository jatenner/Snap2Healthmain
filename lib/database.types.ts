export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      meal_history: {
        Row: {
          id: string
          created_at: string
          user_id: string
          image_url?: string
          caption?: string
          calories?: number
          protein?: number
          carbs?: number
          fat?: number
          nutritional_info?: Json
          goal?: string
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          image_url?: string
          caption?: string
          calories?: number
          protein?: number
          carbs?: number
          fat?: number
          nutritional_info?: Json
          goal?: string
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          image_url?: string
          caption?: string
          calories?: number
          protein?: number
          carbs?: number
          fat?: number
          nutritional_info?: Json
          goal?: string
        }
      }
      profiles: {
        Row: {
          id: string
          created_at: string
          updated_at?: string
          username?: string
          full_name?: string
          avatar_url?: string
          age?: number
          gender?: string
          height?: number
          weight?: number
          goal?: string
        }
        Insert: {
          id: string
          created_at?: string
          updated_at?: string
          username?: string
          full_name?: string
          avatar_url?: string
          age?: number
          gender?: string
          height?: number
          weight?: number
          goal?: string
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          username?: string
          full_name?: string
          avatar_url?: string
          age?: number
          gender?: string
          height?: number
          weight?: number
          goal?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 