
import { supabase } from '@/integrations/supabase/client';
import type { Database as SupabaseDatabase } from '@/integrations/supabase/types';

// Helper function for typed queries
export const getTypedQuery = <T extends keyof SupabaseDatabase['public']['Tables']>(
  table: T
) => {
  return supabase.from(table);
};

// Re-export the Database type for backward compatibility
export type { SupabaseDatabase as Database };

// Types for commonly used tables
export type AppDatabase = {
  public: {
    Tables: {
      jobs: {
        Row: {
          id: string;
          title: string;
          department: string;
          location: string;
          status: 'open' | 'closed' | 'draft' | 'in_progress';
          type: 'full-time' | 'part-time' | 'contract' | 'internship' | 'temporary';
          description: string;
          requirements: string | null;
          responsibilities: string | null;
          salary_range: string | null;
          campaign_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          department: string;
          location: string;
          status?: 'open' | 'closed' | 'draft' | 'in_progress';
          type?: 'full-time' | 'part-time' | 'contract' | 'internship' | 'temporary';
          description: string;
          requirements?: string | null;
          responsibilities?: string | null;
          salary_range?: string | null;
          campaign_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          department?: string;
          location?: string;
          status?: 'open' | 'closed' | 'draft' | 'in_progress';
          type?: 'full-time' | 'part-time' | 'contract' | 'internship' | 'temporary';
          description?: string;
          requirements?: string | null;
          responsibilities?: string | null;
          salary_range?: string | null;
          campaign_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      candidates: {
        Row: {
          id: string;
          first_name: string;
          last_name: string;
          email: string;
          phone: string | null;
          location: string | null;
          resume_url: string | null;
          linkedin_url: string | null;
          portfolio_url: string | null;
          created_at: string;
          updated_at: string;
          analysis_summary: string | null;
          experience_years: number | null;
          skills: string[] | null;
          resume_text: string | null; // Added resume_text field
        };
        Insert: {
          id?: string;
          first_name: string;
          last_name: string;
          email: string;
          phone?: string | null;
          location?: string | null;
          resume_url?: string | null;
          linkedin_url?: string | null;
          portfolio_url?: string | null;
          created_at?: string;
          updated_at?: string;
          analysis_summary?: string | null;
          experience_years?: number | null;
          skills?: string[] | null;
          resume_text?: string | null; // Added resume_text field
        };
        Update: {
          id?: string;
          first_name?: string;
          last_name?: string;
          email?: string;
          phone?: string | null;
          location?: string | null;
          resume_url?: string | null;
          linkedin_url?: string | null;
          portfolio_url?: string | null;
          created_at?: string;
          updated_at?: string;
          analysis_summary?: string | null;
          experience_years?: number | null;
          skills?: string[] | null;
          resume_text?: string | null; // Added resume_text field
        };
      };
      applications: {
        Row: {
          id: string;
          candidate_id: string;
          job_id: string;
          status: string;
          notes: string | null;
          analysis_summary: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          candidate_id: string;
          job_id: string;
          status?: string;
          notes?: string | null;
          analysis_summary?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          candidate_id?: string;
          job_id?: string;
          status?: string;
          notes?: string | null;
          analysis_summary?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      campaigns: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          start_date: string | null;
          end_date: string | null;
          status: string;
          budget: number | null;
          platform: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          status?: string;
          budget?: number | null;
          platform?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          status?: string;
          budget?: number | null;
          platform?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      chatbot_configurations: {
        Row: {
          id: number;
          public_responses: any;
          admin_responses: any;
          updated_at: string;
        };
        Insert: {
          id?: number;
          public_responses?: any;
          admin_responses?: any;
          updated_at?: string;
        };
        Update: {
          id?: number;
          public_responses?: any;
          admin_responses?: any;
          updated_at?: string;
        };
      };
      chatbot_messages: {
        Row: {
          id: string;
          session_id: string;
          user_type: string;
          role: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          user_type: string;
          role: string;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          user_type?: string;
          role?: string;
          content?: string;
          created_at?: string;
        };
      };
      chatbot_knowledge: {
        Row: {
          id: string;
          topic: string;
          question: string;
          answer: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          topic: string;
          question: string;
          answer: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          topic?: string;
          question?: string;
          answer?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      system_settings: {
        Row: {
          id: string;
          company_name: string;
          email_notifications: boolean;
          language: string;
          theme: string;
          created_at: string;
          updated_at: string;
          settings?: Record<string, any>;
        };
        Insert: {
          id?: string;
          company_name?: string;
          email_notifications?: boolean;
          language?: string;
          theme?: string;
          created_at?: string;
          updated_at?: string;
          settings?: Record<string, any>;
        };
        Update: {
          id?: string;
          company_name?: string;
          email_notifications?: boolean;
          language?: string;
          theme?: string;
          created_at?: string;
          updated_at?: string;
          settings?: Record<string, any>;
        };
      };
      training_codes: {
        Row: {
          id: string;
          code: string;
          is_used: boolean;
          created_at: string;
          expires_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          is_used?: boolean;
          created_at?: string;
          expires_at: string;
        };
        Update: {
          id?: string;
          code?: string;
          is_used?: boolean;
          created_at?: string;
          expires_at?: string;
        };
      };
      training_sessions: {
        Row: {
          id: string;
          training_code_id: string;
          candidate_name: string;
          started_at: string;
          ended_at: string | null;
          score: number | null;
          feedback: string | null;
          public_visible: boolean;
        };
        Insert: {
          id?: string;
          training_code_id: string;
          candidate_name: string;
          started_at?: string;
          ended_at?: string | null;
          score?: number | null;
          feedback?: string | null;
          public_visible?: boolean;
        };
        Update: {
          id?: string;
          training_code_id?: string;
          candidate_name?: string;
          started_at?: string;
          ended_at?: string | null;
          score?: number | null;
          feedback?: string | null;
          public_visible?: boolean;
        };
      };
      training_messages: {
        Row: {
          id: string;
          session_id: string;
          sender_type: 'ai' | 'candidate';
          content: string;
          sent_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          sender_type: 'ai' | 'candidate';
          content: string;
          sent_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          sender_type?: 'ai' | 'candidate';
          content?: string;
          sent_at?: string;
        };
      };
    };
  };
};

// Report type for the Reports page
export interface Report {
  id: string;
  name: string;
  type: string;
  created_at: string;
  result: any;
}

// Update SystemSettings type to match the database schema
export interface SystemSettings {
  id: string;
  company_name: string;
  email_notifications: boolean;
  language: string;
  theme: string;
  created_at: string;
  updated_at: string;
  settings?: Record<string, any>;
}

// Utility function to get a public URL for a resume
export const getPublicResumeUrl = (filePath: string) => {
  if (!filePath) return null;
  
  const { data } = supabase.storage
    .from('resumes')
    .getPublicUrl(filePath);
    
  return data?.publicUrl || null;
};

// Función para obtener el tipo de usuario por su ID (función auxiliar)
export const getUserType = async (userId: string) => {
  try {
    // Modificado para comprobar primero si existe un campo role
    const { data } = await supabase
      .from('profiles')
      .select('*')  // Seleccionamos todos los campos en lugar de 'role'
      .eq('id', userId)
      .single();
    
    // Si se encuentra un perfil y tiene un campo 'role', lo devolvemos
    if (data) {
      return (data as any).role || 'user';
    }
    
    return 'user'; // Valor por defecto
  } catch (error) {
    console.error('Error al obtener tipo de usuario:', error);
    return 'user';
  }
};
