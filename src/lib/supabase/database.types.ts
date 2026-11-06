/**
 * Database types mirroring supabase/migrations.
 * Regenerate with the Supabase CLI when the schema changes:
 *   npx supabase gen types typescript --local > src/lib/supabase/database.types.ts
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Rel = never[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: "player" | "admin";
          display_name: string | null;
          current_streak: number;
          longest_streak: number;
          last_played_on: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          role?: "player" | "admin";
          display_name?: string | null;
          current_streak?: number;
          longest_streak?: number;
          last_played_on?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: Rel;
      };
      categories: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string | null;
          icon: string | null;
          image_url: string | null;
          color: string;
          position: number;
          is_published: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          description?: string | null;
          icon?: string | null;
          image_url?: string | null;
          color?: string;
          position?: number;
          is_published?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["categories"]["Insert"]>;
        Relationships: Rel;
      };
      levels: {
        Row: {
          id: string;
          category_id: string;
          position: number;
          pass_percent: number;
          question_count: number;
          is_published: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          category_id: string;
          position: number;
          pass_percent?: number;
          question_count?: number;
          is_published?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["levels"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "levels_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      questions: {
        Row: {
          id: string;
          level_id: string;
          text: string;
          image_url: string | null;
          options: Json;
          correct_index: number;
          explanation: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          level_id: string;
          text: string;
          image_url?: string | null;
          options: Json;
          correct_index: number;
          explanation?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["questions"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "questions_level_id_fkey";
            columns: ["level_id"];
            isOneToOne: false;
            referencedRelation: "levels";
            referencedColumns: ["id"];
          },
        ];
      };
      attempts: {
        Row: {
          id: string;
          user_id: string | null;
          level_id: string;
          score: number;
          total: number;
          stars: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          level_id: string;
          score: number;
          total: number;
          stars?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["attempts"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "attempts_level_id_fkey";
            columns: ["level_id"];
            isOneToOne: false;
            referencedRelation: "levels";
            referencedColumns: ["id"];
          },
        ];
      };
      attempt_answers: {
        Row: { attempt_id: string; question_id: string; is_correct: boolean };
        Insert: { attempt_id: string; question_id: string; is_correct: boolean };
        Update: Partial<Database["public"]["Tables"]["attempt_answers"]["Insert"]>;
        Relationships: Rel;
      };
      user_progress: {
        Row: {
          user_id: string;
          level_id: string;
          best_score: number;
          stars: number;
          unlocked: boolean;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          level_id: string;
          best_score?: number;
          stars?: number;
          unlocked?: boolean;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["user_progress"]["Insert"]>;
        Relationships: Rel;
      };
      badges: {
        Row: { id: string; code: string; name: string; description: string; icon: string };
        Insert: { id?: string; code: string; name: string; description: string; icon?: string };
        Update: Partial<Database["public"]["Tables"]["badges"]["Insert"]>;
        Relationships: Rel;
      };
      user_badges: {
        Row: { user_id: string; badge_id: string; earned_at: string };
        Insert: { user_id: string; badge_id: string; earned_at?: string };
        Update: Partial<Database["public"]["Tables"]["user_badges"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey";
            columns: ["badge_id"];
            isOneToOne: false;
            referencedRelation: "badges";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      admin_level_stats: {
        Row: {
          level_id: string | null;
          category_id: string | null;
          category_name: string | null;
          position: number | null;
          plays: number | null;
          avg_percent: number | null;
        };
        Relationships: Rel;
      };
      admin_missed_questions: {
        Row: {
          question_id: string | null;
          text: string | null;
          category_name: string | null;
          level_position: number | null;
          times_asked: number | null;
          times_missed: number | null;
          miss_rate: number | null;
        };
        Relationships: Rel;
      };
    };
    Functions: {
      submit_attempt: {
        Args: { p_level_id: string; p_answers: Json };
        Returns: Json;
      };
      merge_progress: { Args: { p_items: Json }; Returns: undefined };
      reorder_levels: { Args: { p_category_id: string; p_ids: string[] }; Returns: undefined };
      is_admin: { Args: Record<string, never>; Returns: boolean };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Insert"];
