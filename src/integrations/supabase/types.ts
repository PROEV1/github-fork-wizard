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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      admin_settings: {
        Row: {
          created_at: string
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          setting_key: string
          setting_value?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          address: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      engineer_uploads: {
        Row: {
          description: string | null
          engineer_id: string
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          order_id: string
          upload_type: string
          uploaded_at: string
        }
        Insert: {
          description?: string | null
          engineer_id: string
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          order_id: string
          upload_type: string
          uploaded_at?: string
        }
        Update: {
          description?: string | null
          engineer_id?: string
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          order_id?: string
          upload_type?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "engineer_uploads_engineer_id_fkey"
            columns: ["engineer_id"]
            isOneToOne: false
            referencedRelation: "engineers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "engineer_uploads_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      engineers: {
        Row: {
          availability: boolean | null
          created_at: string
          email: string
          id: string
          name: string
          region: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          availability?: boolean | null
          created_at?: string
          email: string
          id?: string
          name: string
          region?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          availability?: boolean | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          region?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      files: {
        Row: {
          client_id: string
          created_at: string
          document_type: string | null
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          project_id: string | null
          quote_id: string | null
          upload_type: string
          uploaded_by: string
        }
        Insert: {
          client_id: string
          created_at?: string
          document_type?: string | null
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          project_id?: string | null
          quote_id?: string | null
          upload_type: string
          uploaded_by: string
        }
        Update: {
          client_id?: string
          created_at?: string
          document_type?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          project_id?: string | null
          quote_id?: string | null
          upload_type?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "files_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "files_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      installers: {
        Row: {
          availability: boolean | null
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          region: string | null
          updated_at: string
        }
        Insert: {
          availability?: boolean | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          region?: string | null
          updated_at?: string
        }
        Update: {
          availability?: boolean | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          region?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      lead_history: {
        Row: {
          accessories_data: Json | null
          client_id: string
          converted_at: string
          finish: string | null
          id: string
          lead_created_at: string
          lead_email: string
          lead_name: string
          lead_notes: string | null
          lead_phone: string | null
          luxe_upgrade: boolean | null
          original_lead_id: string
          product_name: string | null
          product_price: number | null
          source: string | null
          status: string | null
          total_price: number | null
          width_cm: number | null
        }
        Insert: {
          accessories_data?: Json | null
          client_id: string
          converted_at?: string
          finish?: string | null
          id?: string
          lead_created_at: string
          lead_email: string
          lead_name: string
          lead_notes?: string | null
          lead_phone?: string | null
          luxe_upgrade?: boolean | null
          original_lead_id: string
          product_name?: string | null
          product_price?: number | null
          source?: string | null
          status?: string | null
          total_price?: number | null
          width_cm?: number | null
        }
        Update: {
          accessories_data?: Json | null
          client_id?: string
          converted_at?: string
          finish?: string | null
          id?: string
          lead_created_at?: string
          lead_email?: string
          lead_name?: string
          lead_notes?: string | null
          lead_phone?: string | null
          luxe_upgrade?: boolean | null
          original_lead_id?: string
          product_name?: string | null
          product_price?: number | null
          source?: string | null
          status?: string | null
          total_price?: number | null
          width_cm?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_history_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_status_overrides: {
        Row: {
          client_id: string | null
          external_lead_id: string
          id: string
          notes: string | null
          status: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          client_id?: string | null
          external_lead_id: string
          id?: string
          notes?: string | null
          status: string
          updated_at?: string
          updated_by: string
        }
        Update: {
          client_id?: string | null
          external_lead_id?: string
          id?: string
          notes?: string | null
          status?: string
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_status_overrides_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean | null
          project_id: string | null
          quote_id: string | null
          sender_id: string
          sender_role: Database["public"]["Enums"]["user_role"]
          status: Database["public"]["Enums"]["message_status"] | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          project_id?: string | null
          quote_id?: string | null
          sender_id: string
          sender_role: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["message_status"] | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          project_id?: string | null
          quote_id?: string | null
          sender_id?: string
          sender_role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["message_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      order_activity: {
        Row: {
          activity_type: string
          created_at: string
          created_by: string | null
          description: string
          details: Json | null
          id: string
          order_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string
          created_by?: string | null
          description: string
          details?: Json | null
          id?: string
          order_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          created_by?: string | null
          description?: string
          details?: Json | null
          id?: string
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_activity_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          order_id: string
          paid_at: string | null
          payment_method: string | null
          payment_type: string
          status: string
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          order_id: string
          paid_at?: string | null
          payment_method?: string | null
          payment_type: string
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          order_id?: string
          paid_at?: string | null
          payment_method?: string | null
          payment_type?: string
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          admin_qa_notes: string | null
          agreement_document_url: string | null
          agreement_signed_at: string | null
          amount_paid: number
          client_id: string
          created_at: string
          deposit_amount: number
          engineer_id: string | null
          engineer_notes: string | null
          engineer_signature_data: string | null
          engineer_signed_off_at: string | null
          estimated_duration_hours: number | null
          id: string
          installation_date: string | null
          installation_notes: string | null
          internal_install_notes: string | null
          job_address: string | null
          manual_status_notes: string | null
          manual_status_override: boolean | null
          order_number: string
          quote_id: string
          scheduled_install_date: string | null
          status: string
          status_enhanced:
            | Database["public"]["Enums"]["order_status_enhanced"]
            | null
          time_window: string | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          admin_qa_notes?: string | null
          agreement_document_url?: string | null
          agreement_signed_at?: string | null
          amount_paid?: number
          client_id: string
          created_at?: string
          deposit_amount?: number
          engineer_id?: string | null
          engineer_notes?: string | null
          engineer_signature_data?: string | null
          engineer_signed_off_at?: string | null
          estimated_duration_hours?: number | null
          id?: string
          installation_date?: string | null
          installation_notes?: string | null
          internal_install_notes?: string | null
          job_address?: string | null
          manual_status_notes?: string | null
          manual_status_override?: boolean | null
          order_number: string
          quote_id: string
          scheduled_install_date?: string | null
          status?: string
          status_enhanced?:
            | Database["public"]["Enums"]["order_status_enhanced"]
            | null
          time_window?: string | null
          total_amount?: number
          updated_at?: string
        }
        Update: {
          admin_qa_notes?: string | null
          agreement_document_url?: string | null
          agreement_signed_at?: string | null
          amount_paid?: number
          client_id?: string
          created_at?: string
          deposit_amount?: number
          engineer_id?: string | null
          engineer_notes?: string | null
          engineer_signature_data?: string | null
          engineer_signed_off_at?: string | null
          estimated_duration_hours?: number | null
          id?: string
          installation_date?: string | null
          installation_notes?: string | null
          internal_install_notes?: string | null
          job_address?: string | null
          manual_status_notes?: string | null
          manual_status_override?: boolean | null
          order_number?: string
          quote_id?: string
          scheduled_install_date?: string | null
          status?: string
          status_enhanced?:
            | Database["public"]["Enums"]["order_status_enhanced"]
            | null
          time_window?: string | null
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_engineer_id_fkey"
            columns: ["engineer_id"]
            isOneToOne: false
            referencedRelation: "engineers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_paid: number
          created_at: string
          id: string
          method: string
          paid_on: string | null
          quote_id: string | null
        }
        Insert: {
          amount_paid?: number
          created_at?: string
          id?: string
          method: string
          paid_on?: string | null
          quote_id?: string | null
        }
        Update: {
          amount_paid?: number
          created_at?: string
          id?: string
          method?: string
          paid_on?: string | null
          quote_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      product_compatibility: {
        Row: {
          accessory_product_id: string
          core_product_id: string
          created_at: string
          id: string
        }
        Insert: {
          accessory_product_id: string
          core_product_id: string
          created_at?: string
          id?: string
        }
        Update: {
          accessory_product_id?: string
          core_product_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_compatibility_accessory_product_id_fkey"
            columns: ["accessory_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_compatibility_core_product_id_fkey"
            columns: ["core_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_configurations: {
        Row: {
          configuration_type: string
          created_at: string
          id: string
          is_default: boolean | null
          option_name: string
          option_value: string
          price_modifier: number | null
          product_id: string
        }
        Insert: {
          configuration_type: string
          created_at?: string
          id?: string
          is_default?: boolean | null
          option_name: string
          option_value: string
          price_modifier?: number | null
          product_id: string
        }
        Update: {
          configuration_type?: string
          created_at?: string
          id?: string
          is_default?: boolean | null
          option_name?: string
          option_value?: string
          price_modifier?: number | null
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_configurations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          created_at: string
          id: string
          image_name: string
          image_url: string
          is_primary: boolean | null
          product_id: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          image_name: string
          image_url: string
          is_primary?: boolean | null
          product_id: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          image_name?: string
          image_url?: string
          is_primary?: boolean | null
          product_id?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          base_price: number
          category: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          specifications: Json | null
          updated_at: string
        }
        Insert: {
          base_price?: number
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          specifications?: Json | null
          updated_at?: string
        }
        Update: {
          base_price?: number
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          specifications?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          client_id: string
          created_at: string
          id: string
          installer_id: string | null
          installer_name: string | null
          notes: string | null
          project_name: string
          quote_id: string | null
          scheduled_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          installer_id?: string | null
          installer_name?: string | null
          notes?: string | null
          project_name: string
          quote_id?: string | null
          scheduled_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          installer_id?: string | null
          installer_name?: string | null
          notes?: string | null
          project_name?: string
          quote_id?: string | null
          scheduled_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_installer_id_fkey"
            columns: ["installer_id"]
            isOneToOne: false
            referencedRelation: "installers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_items: {
        Row: {
          configuration: Json | null
          created_at: string
          id: string
          product_id: string | null
          product_name: string
          quantity: number
          quote_id: string
          total_price: number
          unit_price: number
        }
        Insert: {
          configuration?: Json | null
          created_at?: string
          id?: string
          product_id?: string | null
          product_name: string
          quantity?: number
          quote_id: string
          total_price?: number
          unit_price?: number
        }
        Update: {
          configuration?: Json | null
          created_at?: string
          id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          quote_id?: string
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "quote_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          accepted_at: string | null
          appointment_date: string | null
          client_id: string
          created_at: string
          customer_reference: string | null
          deposit_required: number | null
          designer_name: string | null
          expires_at: string | null
          extras_cost: number
          finish: string | null
          id: string
          includes_installation: boolean | null
          install_cost: number
          is_shareable: boolean | null
          materials_cost: number
          notes: string | null
          product_details: string
          quote_number: string
          quote_template: string | null
          range: string | null
          room_info: string | null
          share_token: string | null
          special_instructions: string | null
          status: string
          total_cost: number
          updated_at: string
          warranty_period: string | null
        }
        Insert: {
          accepted_at?: string | null
          appointment_date?: string | null
          client_id: string
          created_at?: string
          customer_reference?: string | null
          deposit_required?: number | null
          designer_name?: string | null
          expires_at?: string | null
          extras_cost?: number
          finish?: string | null
          id?: string
          includes_installation?: boolean | null
          install_cost?: number
          is_shareable?: boolean | null
          materials_cost?: number
          notes?: string | null
          product_details: string
          quote_number: string
          quote_template?: string | null
          range?: string | null
          room_info?: string | null
          share_token?: string | null
          special_instructions?: string | null
          status?: string
          total_cost?: number
          updated_at?: string
          warranty_period?: string | null
        }
        Update: {
          accepted_at?: string | null
          appointment_date?: string | null
          client_id?: string
          created_at?: string
          customer_reference?: string | null
          deposit_required?: number | null
          designer_name?: string | null
          expires_at?: string | null
          extras_cost?: number
          finish?: string | null
          id?: string
          includes_installation?: boolean | null
          install_cost?: number
          is_shareable?: boolean | null
          materials_cost?: number
          notes?: string | null
          product_details?: string
          quote_number?: string
          quote_template?: string | null
          range?: string | null
          room_info?: string | null
          share_token?: string | null
          special_instructions?: string | null
          status?: string
          total_cost?: number
          updated_at?: string
          warranty_period?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_order_status: {
        Args: { order_row: Database["public"]["Tables"]["orders"]["Row"] }
        Returns: Database["public"]["Enums"]["order_status_enhanced"]
      }
      get_user_role: {
        Args: { user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      log_order_activity: {
        Args: {
          p_order_id: string
          p_activity_type: string
          p_description: string
          p_details?: Json
          p_created_by?: string
        }
        Returns: string
      }
    }
    Enums: {
      message_status: "sending" | "sent" | "delivered" | "failed"
      order_status_enhanced:
        | "quote_accepted"
        | "awaiting_payment"
        | "payment_received"
        | "awaiting_agreement"
        | "agreement_signed"
        | "awaiting_install_booking"
        | "scheduled"
        | "in_progress"
        | "install_completed_pending_qa"
        | "completed"
        | "revisit_required"
      user_role:
        | "admin"
        | "client"
        | "engineer"
        | "manager"
        | "standard_office_user"
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
      message_status: ["sending", "sent", "delivered", "failed"],
      order_status_enhanced: [
        "quote_accepted",
        "awaiting_payment",
        "payment_received",
        "awaiting_agreement",
        "agreement_signed",
        "awaiting_install_booking",
        "scheduled",
        "in_progress",
        "install_completed_pending_qa",
        "completed",
        "revisit_required",
      ],
      user_role: [
        "admin",
        "client",
        "engineer",
        "manager",
        "standard_office_user",
      ],
    },
  },
} as const
