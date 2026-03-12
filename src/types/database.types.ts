export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          role: 'student' | 'admin';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: 'student' | 'admin';
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          user_id: string;
          payment_id: string;
          status: 'pending' | 'approved' | 'rejected' | 'refunded';
          amount: number;
          payment_method: string | null;
          created_at: string;
          approved_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          payment_id: string;
          status: 'pending' | 'approved' | 'rejected' | 'refunded';
          amount: number;
          payment_method?: string | null;
          created_at?: string;
          approved_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['orders']['Insert']>;
        Relationships: [];
      };
      lessons: {
        Row: {
          id: string;
          title: string;
          slug: string;
          description: string | null;
          video_url: string;
          thumbnail_url: string | null;
          duration_minutes: number | null;
          module_number: number;
          order_number: number;
          is_published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          description?: string | null;
          video_url: string;
          thumbnail_url?: string | null;
          duration_minutes?: number | null;
          module_number: number;
          order_number: number;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['lessons']['Insert']>;
        Relationships: [];
      };
      modules: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          order_number: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          order_number: number;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['modules']['Insert']>;
        Relationships: [];
      };
      user_progress: {
        Row: {
          id: string;
          user_id: string;
          lesson_id: string;
          completed: boolean;
          watch_time: number;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          lesson_id: string;
          completed?: boolean;
          watch_time?: number;
          completed_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['user_progress']['Insert']>;
        Relationships: [];
      };
      mentorship_sessions: {
        Row: {
          id: string;
          user_id: string;
          scheduled_at: string;
          duration_minutes: number;
          status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
          meeting_url: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          scheduled_at: string;
          duration_minutes?: number;
          status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
          meeting_url?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['mentorship_sessions']['Insert']>;
        Relationships: [];
      };
      materials: {
        Row: {
          id: string;
          lesson_id: string;
          title: string;
          file_url: string;
          file_type: string | null;
          file_size: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          lesson_id: string;
          title: string;
          file_url: string;
          file_type?: string | null;
          file_size?: number | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['materials']['Insert']>;
        Relationships: [];
      };
      quiz_questions: {
        Row: {
          id: string;
          module_number: number;
          question: string;
          options: Json;
          correct_answer_index: number;
          order_number: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          module_number: number;
          question: string;
          options: Json;
          correct_answer_index: number;
          order_number?: number;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['quiz_questions']['Insert']>;
        Relationships: [];
      };
      quiz_attempts: {
        Row: {
          id: string;
          user_id: string;
          module_number: number;
          score: number;
          total: number;
          answers: Json;
          completed_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          module_number: number;
          score: number;
          total: number;
          answers: Json;
          completed_at?: string;
        };
        Update: Partial<Database['public']['Tables']['quiz_attempts']['Insert']>;
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_student_stats: {
        Args: { p_user_id: string };
        Returns: {
          total_lessons: number;
          completed_count: number;
          total_watch_time: number;
        }[];
      };
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      has_paid_access: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
