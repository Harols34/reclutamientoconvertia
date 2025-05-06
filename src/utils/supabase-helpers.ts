
import { supabase } from '@/integrations/supabase/client';

// Helper function for typed queries
export const getTypedQuery = <T extends keyof Database['public']['Tables']>(
  table: T
) => {
  return supabase.from(table);
};

// Types for commonly used tables
export type Database = {
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
      };
      chatbot_configurations: {
        Row: {
          id: number;
          public_responses: any;
          admin_responses: any;
          updated_at: string;
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
      };
    };
  };
};
