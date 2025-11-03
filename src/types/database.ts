export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          full_name: string | null;
          role: 'admin' | 'company' | 'client';
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          full_name?: string | null;
          role: 'admin' | 'company' | 'client';
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          full_name?: string | null;
          role?: 'admin' | 'company' | 'client';
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      templates: {
        Row: {
          id: string;
          company_id: string;
          name: string;
          description: string | null;
          title_es: string | null;
          title_en: string | null;
          title_ar: string | null;
          subtitle_es: string | null;
          subtitle_en: string | null;
          subtitle_ar: string | null;
          design: Json;
          fields: Json;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          name: string;
          description?: string | null;
          title_es?: string | null;
          title_en?: string | null;
          title_ar?: string | null;
          subtitle_es?: string | null;
          subtitle_en?: string | null;
          subtitle_ar?: string | null;
          design?: Json;
          fields?: Json;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          name?: string;
          description?: string | null;
          title_es?: string | null;
          title_en?: string | null;
          title_ar?: string | null;
          subtitle_es?: string | null;
          subtitle_en?: string | null;
          subtitle_ar?: string | null;
          design?: Json;
          fields?: Json;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      submissions: {
        Row: {
          id: string;
          template_id: string;
          client_id: string;
          data: Json;
          status: 'pending' | 'reviewed' | 'approved' | 'rejected';
          review_notes: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          template_id: string;
          client_id: string;
          data: Json;
          status?: 'pending' | 'reviewed' | 'approved' | 'rejected';
          review_notes?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          template_id?: string;
          client_id?: string;
          data?: Json;
          status?: 'pending' | 'reviewed' | 'approved' | 'rejected';
          review_notes?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      files: {
        Row: {
          id: string;
          submission_id: string;
          file_name: string;
          file_path: string;
          file_type: string;
          file_size: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          submission_id: string;
          file_name: string;
          file_path: string;
          file_type?: string;
          file_size?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          submission_id?: string;
          file_name?: string;
          file_path?: string;
          file_type?: string;
          file_size?: number | null;
          created_at?: string;
        };
      };
    };
  };
}
