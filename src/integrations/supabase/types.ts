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
          candidate_id: string
          cover_letter: string | null
          created_at: string
          id: string
          job_id: string
          job_type: string | null
          notes: string | null
          score: number | null
          status: Database["public"]["Enums"]["application_status"]
          updated_at: string
        }
        Insert: {
          candidate_id: string
          cover_letter?: string | null
          created_at?: string
          id?: string
          job_id: string
          job_type?: string | null
          notes?: string | null
          score?: number | null
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
        }
        Update: {
          candidate_id?: string
          cover_letter?: string | null
          created_at?: string
          id?: string
          job_id?: string
          job_type?: string | null
          notes?: string | null
          score?: number | null
          status?: Database["public"]["Enums"]["application_status"]
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
            referencedRelation: "job_applications_view"
            referencedColumns: ["job_id"]
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
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          name: string
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          start_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          start_date?: string
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
          location: string | null
          phone: string | null
          phone_country: string | null
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
          location?: string | null
          phone?: string | null
          phone_country?: string | null
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
          location?: string | null
          phone?: string | null
          phone_country?: string | null
          resume_url?: string | null
          skills?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          sender_id?: string
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
      interactions: {
        Row: {
          application_id: string
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          type: string
        }
        Insert: {
          application_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          type: string
        }
        Update: {
          application_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "interactions_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
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
          status: Database["public"]["Enums"]["job_status"]
          title: string
          type: Database["public"]["Enums"]["job_type"]
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
          status?: Database["public"]["Enums"]["job_status"]
          title: string
          type: Database["public"]["Enums"]["job_type"]
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
          status?: Database["public"]["Enums"]["job_status"]
          title?: string
          type?: Database["public"]["Enums"]["job_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          first_name?: string | null
          id: string
          last_name?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name: string
          parameters: Json
          result: Json | null
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          parameters?: Json
          result?: Json | null
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          parameters?: Json
          result?: Json | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          id: number
          settings: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: number
          settings?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: number
          settings?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      job_applications_view: {
        Row: {
          application_count: number | null
          campaign_id: string | null
          campaign_name: string | null
          created_at: string | null
          department: string | null
          description: string | null
          job_id: string | null
          location: string | null
          requirements: string | null
          responsibilities: string | null
          salary_range: string | null
          status: Database["public"]["Enums"]["job_status"] | null
          title: string | null
          type: Database["public"]["Enums"]["job_type"] | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      get_job_by_id: {
        Args: { job_id: string }
        Returns: {
          id: string
          title: string
          department: string
          location: string
          description: string
          requirements: string
          responsibilities: string
          salary_range: string
          status: string
          type: string
          created_at: string
          updated_at: string
          campaign_id: string
          campaign_name: string
          application_count: number
        }[]
      }
    }
    Enums: {
      application_status:
        | "applied"
        | "reviewing"
        | "interview"
        | "test"
        | "offer"
        | "hired"
        | "rejected"
      job_status: "open" | "in_progress" | "closed"
      job_status_new: "open" | "in_progress" | "closed" | "draft"
      job_type:
        | "full-time"
        | "part-time"
        | "contract"
        | "internship"
        | "temporary"
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
    Enums: {
      application_status: [
        "applied",
        "reviewing",
        "interview",
        "test",
        "offer",
        "hired",
        "rejected",
      ],
      job_status: ["open", "in_progress", "closed"],
      job_status_new: ["open", "in_progress", "closed", "draft"],
      job_type: [
        "full-time",
        "part-time",
        "contract",
        "internship",
        "temporary",
      ],
    },
  },
} as const
