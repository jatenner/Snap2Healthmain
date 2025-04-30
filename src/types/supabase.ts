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
      profiles: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          username: string | null;
          avatar_url: string | null;
          height: string | null;
          weight: string | null;
          age: string | null;
          gender: string | null;
          default_goal: string | null;
        };
        Insert: {
          id: string;
          created_at?: string;
          updated_at?: string;
          username?: string | null;
          avatar_url?: string | null;
          height?: string | null;
          weight?: string | null;
          age?: string | null;
          gender?: string | null;
          default_goal?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          username?: string | null;
          avatar_url?: string | null;
          height?: string | null;
          weight?: string | null;
          age?: string | null;
          gender?: string | null;
          default_goal?: string | null;
        };
      };
      meals: {
        Row: {
          id: string;
          created_at: string;
          user_id: string;
          image_url: string | null;
          meal_name: string | null;
          analysis: Json | null;
          goal: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          user_id: string;
          image_url?: string | null;
          meal_name?: string | null;
          analysis?: Json | null;
          goal?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          user_id?: string;
          image_url?: string | null;
          meal_name?: string | null;
          analysis?: Json | null;
          goal?: string | null;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
} 