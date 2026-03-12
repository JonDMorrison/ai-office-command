export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      agent_insights: {
        Row: {
          agent_role: string
          category: string
          created_at: string
          evidence: string | null
          id: string
          insight_text: string
          signal_count: number | null
          source_task_id: string | null
          workspace_id: string
        }
        Insert: {
          agent_role: string
          category?: string
          created_at?: string
          evidence?: string | null
          id?: string
          insight_text: string
          signal_count?: number | null
          source_task_id?: string | null
          workspace_id: string
        }
        Update: {
          agent_role?: string
          category?: string
          created_at?: string
          evidence?: string | null
          id?: string
          insight_text?: string
          signal_count?: number | null
          source_task_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_insights_source_task_id_fkey"
            columns: ["source_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_memories: {
        Row: {
          agent_role: string
          confidence: string | null
          created_at: string
          expires_at: string | null
          id: string
          importance: number | null
          last_referenced_at: string | null
          memory_text: string
          memory_type: string
          reference_count: number | null
          relevance_score: number
          source: string
          workspace_id: string
        }
        Insert: {
          agent_role: string
          confidence?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          importance?: number | null
          last_referenced_at?: string | null
          memory_text: string
          memory_type?: string
          reference_count?: number | null
          relevance_score?: number
          source?: string
          workspace_id: string
        }
        Update: {
          agent_role?: string
          confidence?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          importance?: number | null
          last_referenced_at?: string | null
          memory_text?: string
          memory_type?: string
          reference_count?: number | null
          relevance_score?: number
          source?: string
          workspace_id?: string
        }
        Relationships: []
      }
      agent_outputs: {
        Row: {
          agent_role: string
          approvals_created: number
          conversation_id: string | null
          created_at: string
          id: string
          insights_created: number
          memories_created: number
          parse_success: boolean
          raw_message: string
          tasks_created: number
          workspace_id: string
        }
        Insert: {
          agent_role: string
          approvals_created?: number
          conversation_id?: string | null
          created_at?: string
          id?: string
          insights_created?: number
          memories_created?: number
          parse_success?: boolean
          raw_message: string
          tasks_created?: number
          workspace_id: string
        }
        Update: {
          agent_role?: string
          approvals_created?: number
          conversation_id?: string | null
          created_at?: string
          id?: string
          insights_created?: number
          memories_created?: number
          parse_success?: boolean
          raw_message?: string
          tasks_created?: number
          workspace_id?: string
        }
        Relationships: []
      }
      agent_sessions: {
        Row: {
          agent_role: string
          id: string
          last_message_at: string | null
          message_count: number | null
          started_at: string | null
          summary: string | null
          workspace_id: string | null
        }
        Insert: {
          agent_role: string
          id?: string
          last_message_at?: string | null
          message_count?: number | null
          started_at?: string | null
          summary?: string | null
          workspace_id?: string | null
        }
        Update: {
          agent_role?: string
          id?: string
          last_message_at?: string | null
          message_count?: number | null
          started_at?: string | null
          summary?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_sessions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_skills: {
        Row: {
          agent_id: string
          created_at: string
          id: string
          skill_description: string
          skill_name: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          id?: string
          skill_description: string
          skill_name: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          id?: string
          skill_description?: string
          skill_name?: string
        }
        Relationships: []
      }
      approvals: {
        Row: {
          agent_role: string
          approval_type: string
          approved_at: string | null
          created_at: string
          full_payload: Json
          id: string
          image_url: string | null
          posted_at: string | null
          preview_text: string | null
          rejected_at: string | null
          status: string
          task_id: string | null
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          agent_role: string
          approval_type: string
          approved_at?: string | null
          created_at?: string
          full_payload?: Json
          id?: string
          image_url?: string | null
          posted_at?: string | null
          preview_text?: string | null
          rejected_at?: string | null
          status?: string
          task_id?: string | null
          title: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          agent_role?: string
          approval_type?: string
          approved_at?: string | null
          created_at?: string
          full_payload?: Json
          id?: string
          image_url?: string | null
          posted_at?: string | null
          preview_text?: string | null
          rejected_at?: string | null
          status?: string
          task_id?: string | null
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "approvals_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_events: {
        Row: {
          created_at: string
          event_payload: Json
          event_type: string
          id: string
          task_id: string
        }
        Insert: {
          created_at?: string
          event_payload?: Json
          event_type: string
          id?: string
          task_id: string
        }
        Update: {
          created_at?: string
          event_payload?: Json
          event_type?: string
          id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_events_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          agent_role: string
          assigned_agent: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          created_by_agent: string | null
          depth: number | null
          description: string | null
          execution_priority: number | null
          id: string
          impact_score: number | null
          input_payload: Json
          output_payload: Json
          parent_task_id: string | null
          priority: number
          requires_approval: boolean
          source: string
          status: string
          task_type: string
          title: string
          updated_at: string
          urgency_score: number | null
          workspace_id: string | null
        }
        Insert: {
          agent_role: string
          assigned_agent?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          created_by_agent?: string | null
          depth?: number | null
          description?: string | null
          execution_priority?: number | null
          id?: string
          impact_score?: number | null
          input_payload?: Json
          output_payload?: Json
          parent_task_id?: string | null
          priority?: number
          requires_approval?: boolean
          source?: string
          status?: string
          task_type?: string
          title: string
          updated_at?: string
          urgency_score?: number | null
          workspace_id?: string | null
        }
        Update: {
          agent_role?: string
          assigned_agent?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          created_by_agent?: string | null
          depth?: number | null
          description?: string | null
          execution_priority?: number | null
          id?: string
          impact_score?: number | null
          input_payload?: Json
          output_payload?: Json
          parent_task_id?: string | null
          priority?: number
          requires_approval?: boolean
          source?: string
          status?: string
          task_type?: string
          title?: string
          updated_at?: string
          urgency_score?: number | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          github_repo: string | null
          gmail_secret_key: string | null
          id: string
          is_active: boolean | null
          name: string
          notion_page_id: string | null
          supabase_project_id: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          github_repo?: string | null
          gmail_secret_key?: string | null
          id: string
          is_active?: boolean | null
          name: string
          notion_page_id?: string | null
          supabase_project_id?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          github_repo?: string | null
          gmail_secret_key?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          notion_page_id?: string | null
          supabase_project_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      ranked_memories: {
        Row: {
          agent_role: string | null
          confidence: string | null
          created_at: string | null
          effective_importance: number | null
          expires_at: string | null
          id: string | null
          importance: number | null
          last_referenced_at: string | null
          memory_text: string | null
          memory_type: string | null
          reference_count: number | null
          relevance_score: number | null
          source: string | null
          workspace_id: string | null
        }
        Insert: {
          agent_role?: string | null
          confidence?: string | null
          created_at?: string | null
          effective_importance?: never
          expires_at?: string | null
          id?: string | null
          importance?: number | null
          last_referenced_at?: string | null
          memory_text?: string | null
          memory_type?: string | null
          reference_count?: number | null
          relevance_score?: number | null
          source?: string | null
          workspace_id?: string | null
        }
        Update: {
          agent_role?: string | null
          confidence?: string | null
          created_at?: string | null
          effective_importance?: never
          expires_at?: string | null
          id?: string | null
          importance?: number | null
          last_referenced_at?: string | null
          memory_text?: string | null
          memory_type?: string | null
          reference_count?: number | null
          relevance_score?: number | null
          source?: string | null
          workspace_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      bump_memory_references: {
        Args: { memory_ids: string[] }
        Returns: undefined
      }
      memory_effective_importance: {
        Args: {
          p_created_at: string
          p_importance: number
          p_last_referenced_at: string
          p_reference_count: number
        }
        Returns: number
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
