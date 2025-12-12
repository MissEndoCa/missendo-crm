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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          appointment_date: string
          check_in_date: string | null
          check_out_date: string | null
          created_at: string | null
          created_by: string | null
          duration_minutes: number | null
          has_companion: boolean | null
          hotel_id: string | null
          id: string
          lead_id: string | null
          nights_count: number | null
          notes: string | null
          organization_id: string
          patient_id: string
          status: Database["public"]["Enums"]["appointment_status"] | null
          transfer_id: string | null
          treatment_id: string | null
          updated_at: string | null
        }
        Insert: {
          appointment_date: string
          check_in_date?: string | null
          check_out_date?: string | null
          created_at?: string | null
          created_by?: string | null
          duration_minutes?: number | null
          has_companion?: boolean | null
          hotel_id?: string | null
          id?: string
          lead_id?: string | null
          nights_count?: number | null
          notes?: string | null
          organization_id: string
          patient_id: string
          status?: Database["public"]["Enums"]["appointment_status"] | null
          transfer_id?: string | null
          treatment_id?: string | null
          updated_at?: string | null
        }
        Update: {
          appointment_date?: string
          check_in_date?: string | null
          check_out_date?: string | null
          created_at?: string | null
          created_by?: string | null
          duration_minutes?: number | null
          has_companion?: boolean | null
          hotel_id?: string | null
          id?: string
          lead_id?: string | null
          nights_count?: number | null
          notes?: string | null
          organization_id?: string
          patient_id?: string
          status?: Database["public"]["Enums"]["appointment_status"] | null
          transfer_id?: string | null
          treatment_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_transfer_id_fkey"
            columns: ["transfer_id"]
            isOneToOne: false
            referencedRelation: "transfer_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_treatment_id_fkey"
            columns: ["treatment_id"]
            isOneToOne: false
            referencedRelation: "treatments"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_records: {
        Row: {
          appointment_id: string | null
          companion_cost: number | null
          created_at: string | null
          currency: string | null
          hotel_cost: number | null
          id: string
          notes: string | null
          organization_id: string
          patient_id: string
          payment_status: string | null
          total_amount: number
          total_discount: number | null
          transfer_cost: number | null
          treatment_cost: number | null
          updated_at: string | null
        }
        Insert: {
          appointment_id?: string | null
          companion_cost?: number | null
          created_at?: string | null
          currency?: string | null
          hotel_cost?: number | null
          id?: string
          notes?: string | null
          organization_id: string
          patient_id: string
          payment_status?: string | null
          total_amount: number
          total_discount?: number | null
          transfer_cost?: number | null
          treatment_cost?: number | null
          updated_at?: string | null
        }
        Update: {
          appointment_id?: string | null
          companion_cost?: number | null
          created_at?: string | null
          currency?: string | null
          hotel_cost?: number | null
          id?: string
          notes?: string | null
          organization_id?: string
          patient_id?: string
          payment_status?: string | null
          total_amount?: number
          total_discount?: number | null
          transfer_cost?: number | null
          treatment_cost?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_records_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_records_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_records_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      hotels: {
        Row: {
          address: string | null
          amenities: string | null
          city: string | null
          companion_price: number | null
          created_at: string | null
          currency: string | null
          hotel_name: string
          id: string
          is_active: boolean | null
          organization_id: string
          price_per_night: number
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          amenities?: string | null
          city?: string | null
          companion_price?: number | null
          created_at?: string | null
          currency?: string | null
          hotel_name: string
          id?: string
          is_active?: boolean | null
          organization_id: string
          price_per_night: number
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          amenities?: string | null
          city?: string | null
          companion_price?: number | null
          created_at?: string | null
          currency?: string | null
          hotel_name?: string
          id?: string
          is_active?: boolean | null
          organization_id?: string
          price_per_night?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hotels_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      income_expenses: {
        Row: {
          amount: number
          category: string
          created_at: string | null
          created_by: string | null
          currency: string | null
          date: string
          description: string | null
          id: string
          notes: string | null
          organization_id: string
          reference_id: string | null
          reference_type: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          category: string
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          date?: string
          description?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          reference_id?: string | null
          reference_type?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          date?: string
          description?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          reference_id?: string | null
          reference_type?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          appointment_scheduled_date: string | null
          assigned_by_missendo: boolean | null
          assigned_to: string | null
          contacted_at: string | null
          country: string | null
          created_at: string | null
          created_by: string | null
          email: string | null
          first_name: string
          id: string
          last_name: string
          notes: string | null
          organization_id: string
          phone: string
          rejection_reason: string | null
          source: string | null
          status: Database["public"]["Enums"]["lead_status"] | null
          updated_at: string | null
          will_come: boolean | null
          will_not_come_reason: string | null
        }
        Insert: {
          appointment_scheduled_date?: string | null
          assigned_by_missendo?: boolean | null
          assigned_to?: string | null
          contacted_at?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          first_name: string
          id?: string
          last_name: string
          notes?: string | null
          organization_id: string
          phone: string
          rejection_reason?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["lead_status"] | null
          updated_at?: string | null
          will_come?: boolean | null
          will_not_come_reason?: string | null
        }
        Update: {
          appointment_scheduled_date?: string | null
          assigned_by_missendo?: boolean | null
          assigned_to?: string | null
          contacted_at?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string
          notes?: string | null
          organization_id?: string
          phone?: string
          rejection_reason?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["lead_status"] | null
          updated_at?: string | null
          will_come?: boolean | null
          will_not_come_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          organization_id: string
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          organization_id: string
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          organization_id?: string
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address: string | null
          category: string | null
          city: string | null
          country: string | null
          created_at: string | null
          email: string | null
          fb_ad_account_id: string | null
          fb_page_access_token: string | null
          id: string
          is_active: boolean | null
          name: string
          phone: string | null
          updated_at: string | null
          wa_access_token: string | null
          wa_phone_number_id: string | null
        }
        Insert: {
          address?: string | null
          category?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          fb_ad_account_id?: string | null
          fb_page_access_token?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          phone?: string | null
          updated_at?: string | null
          wa_access_token?: string | null
          wa_phone_number_id?: string | null
        }
        Update: {
          address?: string | null
          category?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          fb_ad_account_id?: string | null
          fb_page_access_token?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          phone?: string | null
          updated_at?: string | null
          wa_access_token?: string | null
          wa_phone_number_id?: string | null
        }
        Relationships: []
      }
      patient_documents: {
        Row: {
          created_at: string | null
          document_name: string
          document_type: string
          file_path: string
          file_size: number | null
          id: string
          notes: string | null
          organization_id: string
          patient_id: string
          updated_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          document_name: string
          document_type: string
          file_path: string
          file_size?: number | null
          id?: string
          notes?: string | null
          organization_id: string
          patient_id: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          document_name?: string
          document_type?: string
          file_path?: string
          file_size?: number | null
          id?: string
          notes?: string | null
          organization_id?: string
          patient_id?: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: []
      }
      patient_notes: {
        Row: {
          content: string
          created_at: string | null
          created_by: string | null
          id: string
          note_date: string
          organization_id: string
          patient_id: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          note_date?: string
          organization_id: string
          patient_id: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          note_date?: string
          organization_id?: string
          patient_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_notes_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_payments: {
        Row: {
          amount: number
          created_at: string | null
          created_by: string | null
          currency: string | null
          id: string
          notes: string | null
          organization_id: string
          patient_id: string
          payment_date: string
          payment_method: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          patient_id: string
          payment_date?: string
          payment_method?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          patient_id?: string
          payment_date?: string
          payment_method?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_payments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_payments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_transfers: {
        Row: {
          airport_pickup_info: string | null
          clinic_name: string | null
          created_at: string | null
          created_by: string | null
          destination: string | null
          flight_info: string | null
          hotel_id: string | null
          id: string
          notes: string | null
          organization_id: string
          origin: string | null
          patient_id: string
          transfer_datetime: string
          updated_at: string | null
        }
        Insert: {
          airport_pickup_info?: string | null
          clinic_name?: string | null
          created_at?: string | null
          created_by?: string | null
          destination?: string | null
          flight_info?: string | null
          hotel_id?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          origin?: string | null
          patient_id: string
          transfer_datetime: string
          updated_at?: string | null
        }
        Update: {
          airport_pickup_info?: string | null
          clinic_name?: string | null
          created_at?: string | null
          created_by?: string | null
          destination?: string | null
          flight_info?: string | null
          hotel_id?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          origin?: string | null
          patient_id?: string
          transfer_datetime?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_transfers_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_transfers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_transfers_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_treatments: {
        Row: {
          appointment_id: string | null
          created_at: string | null
          currency: string | null
          discount_type: Database["public"]["Enums"]["discount_type"] | null
          discount_value: number | null
          final_price: number
          id: string
          notes: string | null
          patient_id: string
          performed_at: string | null
          price: number
          treatment_date: string | null
          treatment_id: string
          treatment_plan_pdf: string | null
          updated_at: string | null
        }
        Insert: {
          appointment_id?: string | null
          created_at?: string | null
          currency?: string | null
          discount_type?: Database["public"]["Enums"]["discount_type"] | null
          discount_value?: number | null
          final_price: number
          id?: string
          notes?: string | null
          patient_id: string
          performed_at?: string | null
          price: number
          treatment_date?: string | null
          treatment_id: string
          treatment_plan_pdf?: string | null
          updated_at?: string | null
        }
        Update: {
          appointment_id?: string | null
          created_at?: string | null
          currency?: string | null
          discount_type?: Database["public"]["Enums"]["discount_type"] | null
          discount_value?: number | null
          final_price?: number
          id?: string
          notes?: string | null
          patient_id?: string
          performed_at?: string | null
          price?: number
          treatment_date?: string | null
          treatment_id?: string
          treatment_plan_pdf?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_treatments_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_treatments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_treatments_treatment_id_fkey"
            columns: ["treatment_id"]
            isOneToOne: false
            referencedRelation: "treatments"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          address: string | null
          allergies: string | null
          companion_first_name: string | null
          companion_id_number: string | null
          companion_last_name: string | null
          companion_phone: string | null
          country: string | null
          created_at: string | null
          created_by: string | null
          date_of_birth: string | null
          email: string | null
          first_name: string
          gender: string | null
          has_companion: boolean | null
          id: string
          last_name: string
          lead_id: string | null
          medical_condition: string | null
          notes: string | null
          organization_id: string
          phone: string
          photo_url: string | null
          total_cost: number | null
          total_paid: number | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          allergies?: string | null
          companion_first_name?: string | null
          companion_id_number?: string | null
          companion_last_name?: string | null
          companion_phone?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          date_of_birth?: string | null
          email?: string | null
          first_name: string
          gender?: string | null
          has_companion?: boolean | null
          id?: string
          last_name: string
          lead_id?: string | null
          medical_condition?: string | null
          notes?: string | null
          organization_id: string
          phone: string
          photo_url?: string | null
          total_cost?: number | null
          total_paid?: number | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          allergies?: string | null
          companion_first_name?: string | null
          companion_id_number?: string | null
          companion_last_name?: string | null
          companion_phone?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          date_of_birth?: string | null
          email?: string | null
          first_name?: string
          gender?: string | null
          has_companion?: boolean | null
          id?: string
          last_name?: string
          lead_id?: string | null
          medical_condition?: string | null
          notes?: string | null
          organization_id?: string
          phone?: string
          photo_url?: string | null
          total_cost?: number | null
          total_paid?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patients_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patients_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          first_name: string
          id: string
          is_active: boolean | null
          last_name: string
          organization_id: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          first_name: string
          id: string
          is_active?: boolean | null
          last_name: string
          organization_id?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          first_name?: string
          id?: string
          is_active?: boolean | null
          last_name?: string
          organization_id?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      transfer_services: {
        Row: {
          company_name: string
          created_at: string | null
          currency: string | null
          id: string
          is_active: boolean | null
          notes: string | null
          organization_id: string
          price: number
          service_type: string | null
          updated_at: string | null
        }
        Insert: {
          company_name: string
          created_at?: string | null
          currency?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          organization_id: string
          price: number
          service_type?: string | null
          updated_at?: string | null
        }
        Update: {
          company_name?: string
          created_at?: string | null
          currency?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          organization_id?: string
          price?: number
          service_type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transfer_services_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      treatments: {
        Row: {
          base_price: number
          created_at: string | null
          currency: string | null
          description: string | null
          duration_minutes: number | null
          id: string
          is_active: boolean | null
          name: string
          organization_id: string
          updated_at: string | null
        }
        Insert: {
          base_price: number
          created_at?: string | null
          currency?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          organization_id: string
          updated_at?: string | null
        }
        Update: {
          base_price?: number
          created_at?: string | null
          currency?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          organization_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "treatments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          organization_id: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          organization_id?: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          organization_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_organization: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "super_admin" | "clinic_admin" | "clinic_user"
      appointment_status:
        | "scheduled"
        | "confirmed"
        | "completed"
        | "cancelled"
        | "no_show"
      discount_type: "percentage" | "fixed_amount"
      lead_status:
        | "new"
        | "contacted"
        | "no_contact"
        | "appointment_scheduled"
        | "converted"
        | "rejected"
        | "will_not_come"
        | "converted_to_patient"
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
      app_role: ["super_admin", "clinic_admin", "clinic_user"],
      appointment_status: [
        "scheduled",
        "confirmed",
        "completed",
        "cancelled",
        "no_show",
      ],
      discount_type: ["percentage", "fixed_amount"],
      lead_status: [
        "new",
        "contacted",
        "no_contact",
        "appointment_scheduled",
        "converted",
        "rejected",
        "will_not_come",
        "converted_to_patient",
      ],
    },
  },
} as const
