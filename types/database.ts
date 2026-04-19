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
      semanas: {
        Row: {
          id: string
          estado: string
          creado_en: string
        }
        Insert: {
          id?: string
          estado?: string
          creado_en?: string
        }
        Update: {
          id?: string
          estado?: string
          creado_en?: string
        }
        Relationships: []
      }
      turnos: {
        Row: {
          id: string
          codigo: string
        }
        Insert: {
          id?: string
          codigo: string
        }
        Update: {
          id?: string
          codigo?: string
        }
        Relationships: []
      }
      turnos_dia: {
        Row: {
          id: string
          fecha: string
          sucursal_id: string
          turno_id: string
          semana_id: string
        }
        Insert: {
          id?: string
          fecha: string
          sucursal_id: string
          turno_id: string
          semana_id: string
        }
        Update: {
          id?: string
          fecha?: string
          sucursal_id?: string
          turno_id?: string
          semana_id?: string
        }
        Relationships: []
      }
      asignaciones_turno: {
        Row: {
          id: string
          turno_dia_id: string
          trabajador_id: string
          estado: string
        }
        Insert: {
          id?: string
          turno_dia_id: string
          trabajador_id: string
          estado?: string
        }
        Update: {
          id?: string
          turno_dia_id?: string
          trabajador_id?: string
          estado?: string
        }
        Relationships: []
      }
      propinas_diarias: {
        Row: {
          id: string
          fecha: string
          sucursal_id: string
          monto_total: number
        }
        Insert: {
          id?: string
          fecha: string
          sucursal_id: string
          monto_total: number
        }
        Update: {
          id?: string
          fecha?: string
          sucursal_id?: string
          monto_total?: number
        }
        Relationships: []
      }
      propinas_calculadas: {
        Row: {
          id: string
          semana_id: string
          trabajador_id: string
          total_participaciones: number
          monto_total: number
        }
        Insert: {
          id?: string
          semana_id: string
          trabajador_id: string
          total_participaciones: number
          monto_total: number
        }
        Update: {
          id?: string
          semana_id?: string
          trabajador_id?: string
          total_participaciones?: number
          monto_total?: number
        }
        Relationships: []
      }
      trabajadores: {
        Row: {
          id: string
          nombre: string
          activo: boolean
        }
        Insert: {
          id?: string
          nombre: string
          activo?: boolean
        }
        Update: {
          id?: string
          nombre?: string
          activo?: boolean
        }
        Relationships: []
      }
      sucursales: {
        Row: {
          id: string
          nombre: string
          organizacion_id: string
          codigo: string | null
        }
        Insert: {
          id?: string
          nombre: string
          organizacion_id: string
          codigo?: string | null
        }
        Update: {
          id?: string
          nombre?: string
          organizacion_id?: string
          codigo?: string | null
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
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"]
