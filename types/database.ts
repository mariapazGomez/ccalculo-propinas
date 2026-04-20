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
      ajustes_propina: {
        Row: {
          creado_en: string | null
          id: string
          monto_ajuste: number
          motivo: string | null
          semana_id: string
          trabajador_id: string
        }
        Insert: {
          creado_en?: string | null
          id?: string
          monto_ajuste: number
          motivo?: string | null
          semana_id: string
          trabajador_id: string
        }
        Update: {
          creado_en?: string | null
          id?: string
          monto_ajuste?: number
          motivo?: string | null
          semana_id?: string
          trabajador_id?: string
        }
        Relationships: []
      }
      archivos_documentos: {
        Row: {
          creado_en: string
          id: string
          nombre_archivo: string
          organizacion_id: string
          registro_financiero_id: string
          ruta_archivo: string
          subido_por: string | null
          tamano: number | null
          tipo_mime: string | null
        }
        Insert: {
          creado_en?: string
          id?: string
          nombre_archivo: string
          organizacion_id: string
          registro_financiero_id: string
          ruta_archivo: string
          subido_por?: string | null
          tamano?: number | null
          tipo_mime?: string | null
        }
        Update: {
          creado_en?: string
          id?: string
          nombre_archivo?: string
          organizacion_id?: string
          registro_financiero_id?: string
          ruta_archivo?: string
          subido_por?: string | null
          tamano?: number | null
          tipo_mime?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "archivos_documentos_organizacion_id_fkey"
            columns: ["organizacion_id"]
            isOneToOne: false
            referencedRelation: "organizaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "archivos_documentos_registro_financiero_id_fkey"
            columns: ["registro_financiero_id"]
            isOneToOne: false
            referencedRelation: "registros_financieros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "archivos_documentos_subido_por_fkey"
            columns: ["subido_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      asignaciones_turno: {
        Row: {
          creado_en: string | null
          estado: string | null
          id: string
          trabajador_id: string
          turno_dia_id: string
        }
        Insert: {
          creado_en?: string | null
          estado?: string | null
          id?: string
          trabajador_id: string
          turno_dia_id: string
        }
        Update: {
          creado_en?: string | null
          estado?: string | null
          id?: string
          trabajador_id?: string
          turno_dia_id?: string
        }
        Relationships: []
      }
      categorias: {
        Row: {
          creado_en: string
          id: string
          nombre: string
          organizacion_id: string
          tipo: string
        }
        Insert: {
          creado_en?: string
          id?: string
          nombre: string
          organizacion_id: string
          tipo: string
        }
        Update: {
          creado_en?: string
          id?: string
          nombre?: string
          organizacion_id?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "categorias_organizacion_id_fkey"
            columns: ["organizacion_id"]
            isOneToOne: false
            referencedRelation: "organizaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      miembros_organizacion: {
        Row: {
          creado_en: string
          id: string
          organizacion_id: string
          rol: string
          usuario_id: string
        }
        Insert: {
          creado_en?: string
          id?: string
          organizacion_id: string
          rol: string
          usuario_id: string
        }
        Update: {
          creado_en?: string
          id?: string
          organizacion_id?: string
          rol?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "miembros_organizacion_organizacion_id_fkey"
            columns: ["organizacion_id"]
            isOneToOne: false
            referencedRelation: "organizaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "miembros_organizacion_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      miembros_sucursal: {
        Row: {
          creado_en: string
          id: string
          sucursal_id: string
          usuario_id: string
        }
        Insert: {
          creado_en?: string
          id?: string
          sucursal_id: string
          usuario_id: string
        }
        Update: {
          creado_en?: string
          id?: string
          sucursal_id?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "miembros_sucursal_sucursal_id_fkey"
            columns: ["sucursal_id"]
            isOneToOne: false
            referencedRelation: "sucursales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "miembros_sucursal_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizaciones: {
        Row: {
          creado_en: string
          id: string
          nombre: string
        }
        Insert: {
          creado_en?: string
          id?: string
          nombre: string
        }
        Update: {
          creado_en?: string
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      perfiles: {
        Row: {
          creado_en: string
          email: string
          id: string
          nombre_completo: string | null
        }
        Insert: {
          creado_en?: string
          email: string
          id: string
          nombre_completo?: string | null
        }
        Update: {
          creado_en?: string
          email?: string
          id?: string
          nombre_completo?: string | null
        }
        Relationships: []
      }
      propinas_calculadas: {
        Row: {
          ajustado: boolean | null
          creado_en: string | null
          id: string
          monto_total: number
          semana_id: string
          total_participaciones: number
          trabajador_id: string
        }
        Insert: {
          ajustado?: boolean | null
          creado_en?: string | null
          id?: string
          monto_total: number
          semana_id: string
          total_participaciones: number
          trabajador_id: string
        }
        Update: {
          ajustado?: boolean | null
          creado_en?: string | null
          id?: string
          monto_total?: number
          semana_id?: string
          total_participaciones?: number
          trabajador_id?: string
        }
        Relationships: []
      }
      propinas_diarias: {
        Row: {
          creado_en: string | null
          fecha: string
          id: string
          monto_total: number
          sucursal_id: string
        }
        Insert: {
          creado_en?: string | null
          fecha: string
          id?: string
          monto_total: number
          sucursal_id: string
        }
        Update: {
          creado_en?: string | null
          fecha?: string
          id?: string
          monto_total?: number
          sucursal_id?: string
        }
        Relationships: []
      }
      registros_financieros: {
        Row: {
          actualizado_en: string
          categoria_id: string | null
          creado_en: string
          creado_por: string | null
          descripcion: string | null
          estado: string
          fecha_emision: string
          fecha_vencimiento: string | null
          id: string
          moneda: string
          monto_impuesto: number
          monto_neto: number
          monto_total: number
          numero_documento: string | null
          observaciones: string | null
          organizacion_id: string
          sucursal_id: string
          tercero_nombre: string | null
          tipo_registro: string
        }
        Insert: {
          actualizado_en?: string
          categoria_id?: string | null
          creado_en?: string
          creado_por?: string | null
          descripcion?: string | null
          estado?: string
          fecha_emision: string
          fecha_vencimiento?: string | null
          id?: string
          moneda?: string
          monto_impuesto?: number
          monto_neto?: number
          monto_total?: number
          numero_documento?: string | null
          observaciones?: string | null
          organizacion_id: string
          sucursal_id: string
          tercero_nombre?: string | null
          tipo_registro: string
        }
        Update: {
          actualizado_en?: string
          categoria_id?: string | null
          creado_en?: string
          creado_por?: string | null
          descripcion?: string | null
          estado?: string
          fecha_emision?: string
          fecha_vencimiento?: string | null
          id?: string
          moneda?: string
          monto_impuesto?: number
          monto_neto?: number
          monto_total?: number
          numero_documento?: string | null
          observaciones?: string | null
          organizacion_id?: string
          sucursal_id?: string
          tercero_nombre?: string | null
          tipo_registro?: string
        }
        Relationships: [
          {
            foreignKeyName: "registros_financieros_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registros_financieros_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registros_financieros_organizacion_id_fkey"
            columns: ["organizacion_id"]
            isOneToOne: false
            referencedRelation: "organizaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registros_financieros_sucursal_id_fkey"
            columns: ["sucursal_id"]
            isOneToOne: false
            referencedRelation: "sucursales"
            referencedColumns: ["id"]
          },
        ]
      }
      semanas: {
        Row: {
          creado_en: string | null
          estado: string | null
          fecha_fin: string
          fecha_inicio: string
          id: string
          organizacion_id: string
        }
        Insert: {
          creado_en?: string | null
          estado?: string | null
          fecha_fin: string
          fecha_inicio: string
          id?: string
          organizacion_id: string
        }
        Update: {
          creado_en?: string | null
          estado?: string | null
          fecha_fin?: string
          fecha_inicio?: string
          id?: string
          organizacion_id?: string
        }
        Relationships: []
      }
      sucursales: {
        Row: {
          codigo: string | null
          creado_en: string
          direccion: string | null
          id: string
          nombre: string
          organizacion_id: string
        }
        Insert: {
          codigo?: string | null
          creado_en?: string
          direccion?: string | null
          id?: string
          nombre: string
          organizacion_id: string
        }
        Update: {
          codigo?: string | null
          creado_en?: string
          direccion?: string | null
          id?: string
          nombre?: string
          organizacion_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sucursales_organizacion_id_fkey"
            columns: ["organizacion_id"]
            isOneToOne: false
            referencedRelation: "organizaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      trabajadores: {
        Row: {
          activo: boolean | null
          actualizado_en: string | null
          creado_en: string | null
          email: string | null
          id: string
          nombre: string
          organizacion_id: string
          rut: string | null
          telefono: string | null
        }
        Insert: {
          activo?: boolean | null
          actualizado_en?: string | null
          creado_en?: string | null
          email?: string | null
          id?: string
          nombre: string
          organizacion_id: string
          rut?: string | null
          telefono?: string | null
        }
        Update: {
          activo?: boolean | null
          actualizado_en?: string | null
          creado_en?: string | null
          email?: string | null
          id?: string
          nombre?: string
          organizacion_id?: string
          rut?: string | null
          telefono?: string | null
        }
        Relationships: []
      }
      turnos: {
        Row: {
          codigo: string
          id: string
        }
        Insert: {
          codigo: string
          id?: string
        }
        Update: {
          codigo?: string
          id?: string
        }
        Relationships: []
      }
      turnos_dia: {
        Row: {
          creado_en: string | null
          fecha: string
          id: string
          semana_id: string
          sucursal_id: string
          turno_id: string
        }
        Insert: {
          creado_en?: string | null
          fecha: string
          id?: string
          semana_id: string
          sucursal_id: string
          turno_id: string
        }
        Update: {
          creado_en?: string | null
          fecha?: string
          id?: string
          semana_id?: string
          sucursal_id?: string
          turno_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      es_admin_organizacion: {
        Args: { p_organizacion_id: string }
        Returns: boolean
      }
      es_miembro_organizacion: {
        Args: { p_organizacion_id: string }
        Returns: boolean
      }
      generar_turnos_semana: {
        Args: {
          p_fecha_inicio: string
          p_semana_id: string
          p_sucursal_id: string
        }
        Returns: undefined
      }
      tiene_acceso_sucursal: {
        Args: { p_sucursal_id: string }
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
