export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      applications: {
        Row: {
          analysis_summary: string | null
          candidate_id: string
          created_at: string
          id: string
          job_id: string
          notes: string | null
          status: string
          updated_at: string
        }
        Insert: {
          analysis_summary?: string | null
          candidate_id: string
          created_at?: string
          id?: string
          job_id: string
          notes?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          analysis_summary?: string | null
          candidate_id?: string
          created_at?: string
          id?: string
          job_id?: string
          notes?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          budget: number | null
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          name: string
          platform: string | null
          start_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          budget?: number | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          platform?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          budget?: number | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          platform?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      candidates: {
        Row: {
          analysis_summary: string | null
          created_at: string
          email: string
          experience_years: number | null
          first_name: string
          id: string
          last_name: string
          linkedin_url: string | null
          location: string | null
          phone: string | null
          phone_country: string | null
          portfolio_url: string | null
          resume_text: string | null
          resume_url: string | null
          skills: string[] | null
          updated_at: string
        }
        Insert: {
          analysis_summary?: string | null
          created_at?: string
          email: string
          experience_years?: number | null
          first_name: string
          id?: string
          last_name: string
          linkedin_url?: string | null
          location?: string | null
          phone?: string | null
          phone_country?: string | null
          portfolio_url?: string | null
          resume_text?: string | null
          resume_url?: string | null
          skills?: string[] | null
          updated_at?: string
        }
        Update: {
          analysis_summary?: string | null
          created_at?: string
          email?: string
          experience_years?: number | null
          first_name?: string
          id?: string
          last_name?: string
          linkedin_url?: string | null
          location?: string | null
          phone?: string | null
          phone_country?: string | null
          portfolio_url?: string | null
          resume_text?: string | null
          resume_url?: string | null
          skills?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      chatbot_configurations: {
        Row: {
          admin_responses: Json
          id: number
          public_responses: Json
          updated_at: string
        }
        Insert: {
          admin_responses?: Json
          id?: number
          public_responses?: Json
          updated_at?: string
        }
        Update: {
          admin_responses?: Json
          id?: number
          public_responses?: Json
          updated_at?: string
        }
        Relationships: []
      }
      chatbot_knowledge: {
        Row: {
          answer: string
          created_at: string
          id: string
          question: string
          topic: string
          updated_at: string
        }
        Insert: {
          answer: string
          created_at?: string
          id?: string
          question: string
          topic: string
          updated_at?: string
        }
        Update: {
          answer?: string
          created_at?: string
          id?: string
          question?: string
          topic?: string
          updated_at?: string
        }
        Relationships: []
      }
      chatbot_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          session_id: string
          user_type: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          session_id: string
          user_type: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          session_id?: string
          user_type?: string
        }
        Relationships: []
      }
      chatbot_training_codes: {
        Row: {
          active: boolean | null
          client_name: string | null
          client_personality: string | null
          code: string
          created_at: string | null
          expires_at: string | null
          id: string
          interest_level: string | null
          objections: string | null
          product: string | null
        }
        Insert: {
          active?: boolean | null
          client_name?: string | null
          client_personality?: string | null
          code: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          interest_level?: string | null
          objections?: string | null
          product?: string | null
        }
        Update: {
          active?: boolean | null
          client_name?: string | null
          client_personality?: string | null
          code?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          interest_level?: string | null
          objections?: string | null
          product?: string | null
        }
        Relationships: []
      }
      jobs: {
        Row: {
          campaign_id: string | null
          created_at: string
          department: string
          description: string
          id: string
          location: string
          requirements: string | null
          responsibilities: string | null
          salary_range: string | null
          status: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string
          department: string
          description: string
          id?: string
          location: string
          requirements?: string | null
          responsibilities?: string | null
          salary_range?: string | null
          status?: string
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          campaign_id?: string | null
          created_at?: string
          department?: string
          description?: string
          id?: string
          location?: string
          requirements?: string | null
          responsibilities?: string | null
          salary_range?: string | null
          status?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
        }
        Insert: {
          email?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
        }
        Update: {
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
        }
        Relationships: []
      }
      rrhh_absences: {
        Row: {
          created_at: string | null
          end_date: string
          id: string
          start_date: string
          status: string | null
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          end_date: string
          id?: string
          start_date: string
          status?: string | null
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          end_date?: string
          id?: string
          start_date?: string
          status?: string | null
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rrhh_absences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "rrhh_users"
            referencedColumns: ["id"]
          },
        ]
      }
      rrhh_departments: {
        Row: {
          description: string | null
          id: string
          name: string
        }
        Insert: {
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      rrhh_documents: {
        Row: {
          id: string
          name: string
          uploaded_at: string | null
          url: string
          user_id: string | null
        }
        Insert: {
          id?: string
          name: string
          uploaded_at?: string | null
          url: string
          user_id?: string | null
        }
        Update: {
          id?: string
          name?: string
          uploaded_at?: string | null
          url?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rrhh_documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "rrhh_users"
            referencedColumns: ["id"]
          },
        ]
      }
      rrhh_employees: {
        Row: {
          department_id: string | null
          hire_date: string | null
          id: string
          position: string | null
          status: string
          supervisor_id: string | null
          user_id: string | null
        }
        Insert: {
          department_id?: string | null
          hire_date?: string | null
          id?: string
          position?: string | null
          status?: string
          supervisor_id?: string | null
          user_id?: string | null
        }
        Update: {
          department_id?: string | null
          hire_date?: string | null
          id?: string
          position?: string | null
          status?: string
          supervisor_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rrhh_employees_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "rrhh_departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rrhh_employees_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "rrhh_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rrhh_employees_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "rrhh_users"
            referencedColumns: ["id"]
          },
        ]
      }
      rrhh_feedback: {
        Row: {
          created_at: string | null
          id: string
          message: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rrhh_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "rrhh_users"
            referencedColumns: ["id"]
          },
        ]
      }
      rrhh_modules: {
        Row: {
          description: string | null
          id: string
          name: string
        }
        Insert: {
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      rrhh_news: {
        Row: {
          content: string
          created_at: string | null
          id: string
          title: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          title: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          title?: string
        }
        Relationships: []
      }
      rrhh_notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rrhh_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "rrhh_users"
            referencedColumns: ["id"]
          },
        ]
      }
      rrhh_organigram: {
        Row: {
          id: string
          level: number | null
          parent_id: string | null
          position: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          level?: number | null
          parent_id?: string | null
          position?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          level?: number | null
          parent_id?: string | null
          position?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rrhh_organigram_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "rrhh_organigram"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rrhh_organigram_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "rrhh_users"
            referencedColumns: ["id"]
          },
        ]
      }
      rrhh_performance_reviews: {
        Row: {
          created_at: string | null
          feedback: string | null
          id: string
          period: string | null
          reviewer_id: string | null
          score: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          feedback?: string | null
          id?: string
          period?: string | null
          reviewer_id?: string | null
          score?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          feedback?: string | null
          id?: string
          period?: string | null
          reviewer_id?: string | null
          score?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rrhh_performance_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "rrhh_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rrhh_performance_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "rrhh_users"
            referencedColumns: ["id"]
          },
        ]
      }
      rrhh_permissions: {
        Row: {
          id: string
          module_id: string | null
          role_id: string | null
        }
        Insert: {
          id?: string
          module_id?: string | null
          role_id?: string | null
        }
        Update: {
          id?: string
          module_id?: string | null
          role_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rrhh_permissions_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "rrhh_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rrhh_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "rrhh_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      rrhh_personal: {
        Row: {
          department: string | null
          hire_date: string | null
          id: string
          position: string | null
          status: string | null
          supervisor_id: string | null
          user_id: string | null
        }
        Insert: {
          department?: string | null
          hire_date?: string | null
          id?: string
          position?: string | null
          status?: string | null
          supervisor_id?: string | null
          user_id?: string | null
        }
        Update: {
          department?: string | null
          hire_date?: string | null
          id?: string
          position?: string | null
          status?: string | null
          supervisor_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rrhh_personal_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "rrhh_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rrhh_personal_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "rrhh_users"
            referencedColumns: ["id"]
          },
        ]
      }
      rrhh_roles: {
        Row: {
          description: string | null
          id: string
          name: string
        }
        Insert: {
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      rrhh_sessions: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rrhh_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "rrhh_users"
            referencedColumns: ["id"]
          },
        ]
      }
      rrhh_time_tracking: {
        Row: {
          check_in: string | null
          check_out: string | null
          date: string
          hours_worked: number | null
          id: string
          user_id: string | null
        }
        Insert: {
          check_in?: string | null
          check_out?: string | null
          date: string
          hours_worked?: number | null
          id?: string
          user_id?: string | null
        }
        Update: {
          check_in?: string | null
          check_out?: string | null
          date?: string
          hours_worked?: number | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rrhh_time_tracking_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "rrhh_users"
            referencedColumns: ["id"]
          },
        ]
      }
      rrhh_users: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          password_hash: string
          role_id: string | null
          status: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          password_hash: string
          role_id?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          password_hash?: string
          role_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "rrhh_users_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "rrhh_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      training_codes: {
        Row: {
          code: string
          created_at: string
          expires_at: string
          id: string
          is_used: boolean | null
        }
        Insert: {
          code: string
          created_at?: string
          expires_at: string
          id?: string
          is_used?: boolean | null
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          is_used?: boolean | null
        }
        Relationships: []
      }
      training_evaluations: {
        Row: {
          areas_to_improve: string | null
          created_at: string
          id: string
          recommendations: string | null
          session_id: string
          strengths: string | null
          updated_at: string
        }
        Insert: {
          areas_to_improve?: string | null
          created_at?: string
          id?: string
          recommendations?: string | null
          session_id: string
          strengths?: string | null
          updated_at?: string
        }
        Update: {
          areas_to_improve?: string | null
          created_at?: string
          id?: string
          recommendations?: string | null
          session_id?: string
          strengths?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_evaluations_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: true
            referencedRelation: "training_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      training_messages: {
        Row: {
          content: string
          id: string
          sender_type: string
          sent_at: string
          session_id: string
        }
        Insert: {
          content: string
          id?: string
          sender_type: string
          sent_at?: string
          session_id: string
        }
        Update: {
          content?: string
          id?: string
          sender_type?: string
          sent_at?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "training_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      training_sessions: {
        Row: {
          candidate_name: string
          ended_at: string | null
          feedback: string | null
          id: string
          public_visible: boolean | null
          score: number | null
          started_at: string
          training_code_id: string
        }
        Insert: {
          candidate_name: string
          ended_at?: string | null
          feedback?: string | null
          id?: string
          public_visible?: boolean | null
          score?: number | null
          started_at?: string
          training_code_id: string
        }
        Update: {
          candidate_name?: string
          ended_at?: string | null
          feedback?: string | null
          id?: string
          public_visible?: boolean | null
          score?: number | null
          started_at?: string
          training_code_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_sessions_training_code_id_fkey"
            columns: ["training_code_id"]
            isOneToOne: false
            referencedRelation: "training_codes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_or_update_application: {
        Args: {
          p_first_name: string
          p_last_name: string
          p_email: string
          p_phone: string
          p_phone_country: string
          p_job_id: string
          p_cover_letter: string
          p_job_type: string
          p_resume_url: string
        }
        Returns: string
      }
      get_complete_training_session: {
        Args: { p_session_id: string }
        Returns: {
          id: string
          candidate_name: string
          started_at: string
          ended_at: string
          score: number
          feedback: string
          public_visible: boolean
          training_code: string
          messages: Json
          strengths: string
          areas_to_improve: string
          recommendations: string
        }[]
      }
      get_complete_training_sessions: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          candidate_name: string
          started_at: string
          ended_at: string
          score: number
          feedback: string
          public_visible: boolean
          training_code: string
          messages: Json
          strengths: string
          areas_to_improve: string
          recommendations: string
        }[]
      }
      get_job_by_id: {
        Args: { p_job_id: string }
        Returns: {
          id: string
          title: string
          department: string
          location: string
          status: string
          type: string
          description: string
          requirements: string
          responsibilities: string
          salary_range: string
          campaign_id: string
          created_at: string
          updated_at: string
          application_count: number
        }[]
      }
      migrate_sessions_to_evaluations: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
