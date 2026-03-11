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
          room_type: string | null
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
          room_type?: string | null
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
          room_type?: string | null
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
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          organization_id: string | null
          record_id: string | null
          table_name: string
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          organization_id?: string | null
          record_id?: string | null
          table_name: string
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          organization_id?: string | null
          record_id?: string | null
          table_name?: string
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      campaign_recipients: {
        Row: {
          campaign_id: string
          created_at: string | null
          email: string
          error_message: string | null
          id: string
          opened_at: string | null
          recipient_id: string | null
          recipient_name: string | null
          recipient_type: string | null
          sent_at: string | null
          status: string | null
        }
        Insert: {
          campaign_id: string
          created_at?: string | null
          email: string
          error_message?: string | null
          id?: string
          opened_at?: string | null
          recipient_id?: string | null
          recipient_name?: string | null
          recipient_type?: string | null
          sent_at?: string | null
          status?: string | null
        }
        Update: {
          campaign_id?: string
          created_at?: string | null
          email?: string
          error_message?: string | null
          id?: string
          opened_at?: string | null
          recipient_id?: string | null
          recipient_name?: string | null
          recipient_type?: string | null
          sent_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_recipients_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_groups: {
        Row: {
          color: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          organization_id: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          organization_id: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          organization_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_groups_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_groups_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      email_campaigns: {
        Row: {
          completed_at: string | null
          content: string
          created_at: string | null
          created_by: string | null
          failed_count: number | null
          html_content: string | null
          id: string
          name: string
          opened_count: number | null
          organization_id: string
          scheduled_at: string | null
          sent_count: number | null
          started_at: string | null
          status: string | null
          subject: string
          template_id: string | null
          total_recipients: number | null
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          content: string
          created_at?: string | null
          created_by?: string | null
          failed_count?: number | null
          html_content?: string | null
          id?: string
          name: string
          opened_count?: number | null
          organization_id: string
          scheduled_at?: string | null
          sent_count?: number | null
          started_at?: string | null
          status?: string | null
          subject: string
          template_id?: string | null
          total_recipients?: number | null
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          content?: string
          created_at?: string | null
          created_by?: string | null
          failed_count?: number | null
          html_content?: string | null
          id?: string
          name?: string
          opened_count?: number | null
          organization_id?: string
          scheduled_at?: string | null
          sent_count?: number | null
          started_at?: string | null
          status?: string | null
          subject?: string
          template_id?: string | null
          total_recipients?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_campaigns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_campaigns_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_campaigns_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          content: string
          created_at: string | null
          created_by: string | null
          html_content: string | null
          id: string
          is_active: boolean | null
          name: string
          organization_id: string
          subject: string
          updated_at: string | null
          variables: string[] | null
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by?: string | null
          html_content?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          organization_id: string
          subject: string
          updated_at?: string | null
          variables?: string[] | null
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by?: string | null
          html_content?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          organization_id?: string
          subject?: string
          updated_at?: string | null
          variables?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "email_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
          double_room_price: number | null
          family_room_price: number | null
          hotel_name: string
          id: string
          is_active: boolean | null
          organization_id: string
          price_per_night: number
          single_room_price: number | null
          star_rating: number | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          amenities?: string | null
          city?: string | null
          companion_price?: number | null
          created_at?: string | null
          currency?: string | null
          double_room_price?: number | null
          family_room_price?: number | null
          hotel_name: string
          id?: string
          is_active?: boolean | null
          organization_id: string
          price_per_night: number
          single_room_price?: number | null
          star_rating?: number | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          amenities?: string | null
          city?: string | null
          companion_price?: number | null
          created_at?: string | null
          currency?: string | null
          double_room_price?: number | null
          family_room_price?: number | null
          hotel_name?: string
          id?: string
          is_active?: boolean | null
          organization_id?: string
          price_per_night?: number
          single_room_price?: number | null
          star_rating?: number | null
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
          patient_id: string | null
          payment_method: string | null
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
          patient_id?: string | null
          payment_method?: string | null
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
          patient_id?: string | null
          payment_method?: string | null
          reference_id?: string | null
          reference_type?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "income_expenses_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_group_members: {
        Row: {
          added_at: string | null
          added_by: string | null
          group_id: string
          id: string
          lead_id: string
        }
        Insert: {
          added_at?: string | null
          added_by?: string | null
          group_id: string
          id?: string
          lead_id: string
        }
        Update: {
          added_at?: string | null
          added_by?: string | null
          group_id?: string
          id?: string
          lead_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_group_members_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "contact_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_group_members_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
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
      marketer_meetings: {
        Row: {
          address: string | null
          business_name: string
          business_type: string | null
          city: string | null
          contact_name: string
          created_at: string | null
          created_by: string | null
          id: string
          meeting_date: string
          notes: string | null
          organization_id: string
          phone: string | null
          result: Database["public"]["Enums"]["meeting_result"] | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          business_name: string
          business_type?: string | null
          city?: string | null
          contact_name: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          meeting_date: string
          notes?: string | null
          organization_id: string
          phone?: string | null
          result?: Database["public"]["Enums"]["meeting_result"] | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          business_name?: string
          business_type?: string | null
          city?: string | null
          contact_name?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          meeting_date?: string
          notes?: string | null
          organization_id?: string
          phone?: string | null
          result?: Database["public"]["Enums"]["meeting_result"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketer_meetings_organization_id_fkey"
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
          fb_connected_at: string | null
          fb_page_access_token: string | null
          fb_page_id: string | null
          fb_page_name: string | null
          fb_selected_adsets: Json | null
          fb_selected_campaigns: Json | null
          fb_user_access_token: string | null
          fb_user_id: string | null
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
          fb_connected_at?: string | null
          fb_page_access_token?: string | null
          fb_page_id?: string | null
          fb_page_name?: string | null
          fb_selected_adsets?: Json | null
          fb_selected_campaigns?: Json | null
          fb_user_access_token?: string | null
          fb_user_id?: string | null
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
          fb_connected_at?: string | null
          fb_page_access_token?: string | null
          fb_page_id?: string | null
          fb_page_name?: string | null
          fb_selected_adsets?: Json | null
          fb_selected_campaigns?: Json | null
          fb_user_access_token?: string | null
          fb_user_id?: string | null
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
          category: string | null
          created_at: string | null
          document_name: string
          document_type: string
          file_path: string
          file_size: number | null
          id: string
          is_sensitive: boolean
          notes: string | null
          organization_id: string
          patient_id: string
          updated_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          document_name: string
          document_type: string
          file_path: string
          file_size?: number | null
          id?: string
          is_sensitive?: boolean
          notes?: string | null
          organization_id: string
          patient_id: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          document_name?: string
          document_type?: string
          file_path?: string
          file_size?: number | null
          id?: string
          is_sensitive?: boolean
          notes?: string | null
          organization_id?: string
          patient_id?: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: []
      }
      patient_group_members: {
        Row: {
          added_at: string | null
          added_by: string | null
          group_id: string
          id: string
          patient_id: string
        }
        Insert: {
          added_at?: string | null
          added_by?: string | null
          group_id: string
          id?: string
          patient_id: string
        }
        Update: {
          added_at?: string | null
          added_by?: string | null
          group_id?: string
          id?: string
          patient_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_group_members_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "contact_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_group_members_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
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
            foreignKeyName: "patient_notes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
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
          airline: string | null
          airport_pickup_info: string | null
          arrival_airport: string | null
          arrival_time: string | null
          clinic_name: string | null
          created_at: string | null
          created_by: string | null
          departure_airport: string | null
          departure_time: string | null
          destination: string | null
          flight_info: string | null
          hotel_id: string | null
          id: string
          notes: string | null
          organization_id: string
          origin: string | null
          patient_id: string
          transfer_datetime: string
          transfer_type: string | null
          updated_at: string | null
        }
        Insert: {
          airline?: string | null
          airport_pickup_info?: string | null
          arrival_airport?: string | null
          arrival_time?: string | null
          clinic_name?: string | null
          created_at?: string | null
          created_by?: string | null
          departure_airport?: string | null
          departure_time?: string | null
          destination?: string | null
          flight_info?: string | null
          hotel_id?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          origin?: string | null
          patient_id: string
          transfer_datetime: string
          transfer_type?: string | null
          updated_at?: string | null
        }
        Update: {
          airline?: string | null
          airport_pickup_info?: string | null
          arrival_airport?: string | null
          arrival_time?: string | null
          clinic_name?: string | null
          created_at?: string | null
          created_by?: string | null
          departure_airport?: string | null
          departure_time?: string | null
          destination?: string | null
          flight_info?: string | null
          hotel_id?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          origin?: string | null
          patient_id?: string
          transfer_datetime?: string
          transfer_type?: string | null
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
          clinic_payment: number | null
          companion_first_name: string | null
          companion_id_number: string | null
          companion_last_name: string | null
          companion_phone: string | null
          country: string | null
          created_at: string | null
          created_by: string | null
          crm_status: Database["public"]["Enums"]["crm_status"] | null
          date_of_birth: string | null
          downpayment: number | null
          email: string | null
          estimated_price: number | null
          final_price: number | null
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
          clinic_payment?: number | null
          companion_first_name?: string | null
          companion_id_number?: string | null
          companion_last_name?: string | null
          companion_phone?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          crm_status?: Database["public"]["Enums"]["crm_status"] | null
          date_of_birth?: string | null
          downpayment?: number | null
          email?: string | null
          estimated_price?: number | null
          final_price?: number | null
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
          clinic_payment?: number | null
          companion_first_name?: string | null
          companion_id_number?: string | null
          companion_last_name?: string | null
          companion_phone?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          crm_status?: Database["public"]["Enums"]["crm_status"] | null
          date_of_birth?: string | null
          downpayment?: number | null
          email?: string | null
          estimated_price?: number | null
          final_price?: number | null
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
      reminder_call_logs: {
        Row: {
          call_result: string
          called_at: string
          called_by: string | null
          created_at: string
          id: string
          notes: string | null
          reminder_id: string
        }
        Insert: {
          call_result: string
          called_at?: string
          called_by?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          reminder_id: string
        }
        Update: {
          call_result?: string
          called_at?: string
          called_by?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          reminder_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminder_call_logs_called_by_fkey"
            columns: ["called_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminder_call_logs_reminder_id_fkey"
            columns: ["reminder_id"]
            isOneToOne: false
            referencedRelation: "reminders"
            referencedColumns: ["id"]
          },
        ]
      }
      reminder_notify_users: {
        Row: {
          created_at: string
          id: string
          reminder_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reminder_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reminder_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminder_notify_users_reminder_id_fkey"
            columns: ["reminder_id"]
            isOneToOne: false
            referencedRelation: "reminders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminder_notify_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reminders: {
        Row: {
          completed_at: string | null
          created_at: string | null
          created_by: string
          email_sent_at: string | null
          id: string
          lead_id: string | null
          notes: string | null
          notify_all_admins: boolean | null
          organization_id: string
          patient_id: string | null
          reminder_date: string
          reminder_type: string
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          created_by: string
          email_sent_at?: string | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          notify_all_admins?: boolean | null
          organization_id: string
          patient_id?: string | null
          reminder_date: string
          reminder_type?: string
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string
          email_sent_at?: string | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          notify_all_admins?: boolean | null
          organization_id?: string
          patient_id?: string | null
          reminder_date?: string
          reminder_type?: string
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reminders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminders_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminders_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
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
      user_group_members: {
        Row: {
          added_at: string | null
          added_by: string | null
          group_id: string
          id: string
          user_id: string
        }
        Insert: {
          added_at?: string | null
          added_by?: string | null
          group_id: string
          id?: string
          user_id: string
        }
        Update: {
          added_at?: string | null
          added_by?: string | null
          group_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_group_members_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "contact_groups"
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
      crm_status:
        | "new_lead"
        | "called_answered"
        | "called_no_answer"
        | "waiting_photos"
        | "photos_received"
        | "treatment_plan_sent"
        | "follow_up"
        | "confirmed"
        | "completed"
        | "lost"
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
      meeting_result: "positive" | "negative" | "pending" | "follow_up"
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
      crm_status: [
        "new_lead",
        "called_answered",
        "called_no_answer",
        "waiting_photos",
        "photos_received",
        "treatment_plan_sent",
        "follow_up",
        "confirmed",
        "completed",
        "lost",
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
      meeting_result: ["positive", "negative", "pending", "follow_up"],
    },
  },
} as const
