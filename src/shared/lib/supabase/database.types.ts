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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      sh_fill_events: {
        Row: {
          created_at: string
          fill_price: number
          fill_quantity: number
          fill_time: string
          id: string
          order_id: string
          order_type: Database["public"]["Enums"]["sh_order_type"]
          profit_loss: number | null
          stock_code: string
          strategy_id: string
        }
        Insert: {
          created_at?: string
          fill_price: number
          fill_quantity: number
          fill_time: string
          id?: string
          order_id: string
          order_type: Database["public"]["Enums"]["sh_order_type"]
          profit_loss?: number | null
          stock_code: string
          strategy_id: string
        }
        Update: {
          created_at?: string
          fill_price?: number
          fill_quantity?: number
          fill_time?: string
          id?: string
          order_id?: string
          order_type?: Database["public"]["Enums"]["sh_order_type"]
          profit_loss?: number | null
          stock_code?: string
          strategy_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sh_fill_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "sh_grid_orders"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "sh_fill_events_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "sh_grid_strategies"
            referencedColumns: ["id"]
          },
        ]
      }
      sh_grid_orders: {
        Row: {
          created_at: string
          filled_at: string | null
          grid_price: number
          id: string
          order_id: string
          order_type: Database["public"]["Enums"]["sh_order_type"]
          quantity: number
          status: Database["public"]["Enums"]["sh_order_status"]
          stock_code: string
          strategy_id: string
        }
        Insert: {
          created_at?: string
          filled_at?: string | null
          grid_price: number
          id?: string
          order_id: string
          order_type: Database["public"]["Enums"]["sh_order_type"]
          quantity: number
          status?: Database["public"]["Enums"]["sh_order_status"]
          stock_code: string
          strategy_id: string
        }
        Update: {
          created_at?: string
          filled_at?: string | null
          grid_price?: number
          id?: string
          order_id?: string
          order_type?: Database["public"]["Enums"]["sh_order_type"]
          quantity?: number
          status?: Database["public"]["Enums"]["sh_order_status"]
          stock_code?: string
          strategy_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sh_grid_orders_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "sh_grid_strategies"
            referencedColumns: ["id"]
          },
        ]
      }
      sh_grid_strategies: {
        Row: {
          created_at: string
          grid_gap: number
          id: string
          is_active: boolean
          lower_grid_count: number
          min_holding_limit: number
          quantity_per_grid: number
          stock_code: string
          stock_name: string
          target_price: number | null
          updated_at: string
          upper_grid_count: number
        }
        Insert: {
          created_at?: string
          grid_gap: number
          id?: string
          is_active?: boolean
          lower_grid_count: number
          min_holding_limit: number
          quantity_per_grid: number
          stock_code: string
          stock_name: string
          target_price?: number | null
          updated_at?: string
          upper_grid_count: number
        }
        Update: {
          created_at?: string
          grid_gap?: number
          id?: string
          is_active?: boolean
          lower_grid_count?: number
          min_holding_limit?: number
          quantity_per_grid?: number
          stock_code?: string
          stock_name?: string
          target_price?: number | null
          updated_at?: string
          upper_grid_count?: number
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
      sh_order_status: "PENDING" | "FILLED" | "CANCELLED"
      sh_order_type: "BUY" | "SELL"
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
    Enums: {
      sh_order_status: ["PENDING", "FILLED", "CANCELLED"],
      sh_order_type: ["BUY", "SELL"],
    },
  },
} as const
