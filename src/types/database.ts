
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  incidents: {
    Tables: {
      incidents: {
        Row: {
          actualizado_en: string | null
          asignado_a: string | null
          creado_en: string | null
          descripcion: string
          estado: string
          etiquetas: string | null
          id: string
          impacto: string | null
          reportado_por: string | null
          resuelto_en: string | null
          severidad: string
          sistemas_afectados: string | null
          tipo: string
          titulo: string
        }
        Insert: {
          actualizado_en?: string | null
          asignado_a?: string | null
          creado_en?: string | null
          descripcion: string
          estado: string
          etiquetas?: string | null
          id: string
          impacto?: string | null
          reportado_por?: string | null
          resuelto_en?: string | null
          severidad: string
          sistemas_afectados?: string | null
          tipo: string
          titulo: string
        }
        Update: {
          actualizado_en?: string | null
          asignado_a?: string | null
          creado_en?: string | null
          descripcion?: string
          estado?: string
          etiquetas?: string | null
          id?: string
          impacto?: string | null
          reportado_por?: string | null
          resuelto_en?: string | null
          severidad?: string
          sistemas_afectados?: string | null
          tipo?: string
          titulo?: string
        }
        Relationships: []
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
  logs: {
    Tables: {
      [_ in never]: never
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_user_has_security_answers: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      cleanup_expired_recovery_attempts: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_user_profile: {
        Args: { user_id: string; user_name: string; user_department: string }
        Returns: undefined
      }
      verify_argon2_hash: {
        Args: { stored_hash: string; provided_answer: string }
        Returns: boolean
      }
      verify_security_answer: {
        Args: { stored_hash: string; provided_answer: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  users: {
    Tables: {
      password_recovery_attempts: {
        Row: {
          attempts_count: number | null
          created_at: string | null
          email: string
          expires_at: string
          id: string
          is_used: boolean | null
          max_attempts: number | null
          recovery_token: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          attempts_count?: number | null
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          is_used?: boolean | null
          max_attempts?: number | null
          recovery_token?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          attempts_count?: number | null
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          is_used?: boolean | null
          max_attempts?: number | null
          recovery_token?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      roles: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          permissions: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          permissions?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          permissions?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      security_questions: {
        Row: {
          category: string | null
          created_at: string | null
          id: number
          is_active: boolean | null
          question_text: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          question_text: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          question_text?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          assigned_by: string | null
          created_at: string | null
          id: string
          role_id: string | null
          user_id: string | null
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string | null
          id?: string
          role_id?: string | null
          user_id?: string | null
        }
        Update: {
          assigned_by?: string | null
          created_at?: string | null
          id?: string
          role_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "usuarios_con_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "usuarios_con_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_security_answers: {
        Row: {
          answer_hash: string
          created_at: string | null
          id: string
          question_id: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          answer_hash: string
          created_at?: string | null
          id?: string
          question_id: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          answer_hash?: string
          created_at?: string | null
          id?: string
          question_id?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_security_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "security_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios: {
        Row: {
          created_at: string | null
          department: string | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          department?: string | null
          id: string
          is_active?: boolean | null
          metadata?: Json | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          department?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      usuarios_con_roles: {
        Row: {
          auth_created_at: string | null
          created_at: string | null
          department: string | null
          email: string | null
          id: string | null
          is_active: boolean | null
          name: string | null
          permissions: Json[] | null
          roles: string[] | null
          updated_at: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      can_attempt_password_recovery: {
        Args: { user_email: string }
        Returns: boolean
      }
      change_password_with_verification: {
        Args: {
          user_email: string
          new_password: string
          verified_answers: Json
        }
        Returns: boolean
      }
      check_user_has_security_answers: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      current_user_has_role: {
        Args: { role_name: string }
        Returns: boolean
      }
      current_user_is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      debug_save_user_security_answers_hashed: {
        Args: { p_user_id: string; p_answers: Json }
        Returns: Json
      }
      get_user_permissions: {
        Args: { user_uuid: string }
        Returns: Json
      }
      get_user_security_questions_by_email: {
        Args: { user_email: string }
        Returns: {
          question_id: number
          question_text: string
          category: string
        }[]
      }
      has_permission: {
        Args: { user_uuid: string; permission_path: string }
        Returns: boolean
      }
      hash_security_answer: {
        Args: { answer_text: string }
        Returns: string
      }
      hash_security_answer_v2: {
        Args: { answer_text: string }
        Returns: string
      }
      save_user_security_answers_hashed: {
        Args: { p_user_id: string; p_answers: Json }
        Returns: boolean
      }
      update_reporte_as_analista: {
        Args: { reporte_id: string; new_data: Json }
        Returns: boolean
      }
      verify_security_answer: {
        Args: { p_user_id: string; p_question_id: number; p_answer: string }
        Returns: boolean
      }
      verify_security_answers_by_email: {
        Args: { user_email: string; provided_answers: Json }
        Returns: boolean
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
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "incidents">]

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
  incidents: {
    Enums: {},
  },
  logs: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
  users: {
    Enums: {},
  },
} as const
