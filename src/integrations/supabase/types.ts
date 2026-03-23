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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_notifications: {
        Row: {
          created_at: string | null
          group_profile_id: string | null
          id: string
          message: string | null
          read: boolean | null
          title: string
          type: string
        }
        Insert: {
          created_at?: string | null
          group_profile_id?: string | null
          id?: string
          message?: string | null
          read?: boolean | null
          title: string
          type: string
        }
        Update: {
          created_at?: string | null
          group_profile_id?: string | null
          id?: string
          message?: string | null
          read?: boolean | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_notifications_group_profile_id_fkey"
            columns: ["group_profile_id"]
            isOneToOne: false
            referencedRelation: "group_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      blocked_dates: {
        Row: {
          blocked_date: string
          created_at: string
          group_profile_id: string
          id: string
        }
        Insert: {
          blocked_date: string
          created_at?: string
          group_profile_id: string
          id?: string
        }
        Update: {
          blocked_date?: string
          created_at?: string
          group_profile_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocked_dates_group_profile_id_fkey"
            columns: ["group_profile_id"]
            isOneToOne: false
            referencedRelation: "group_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          advance_amount: number
          advance_paid: boolean
          client_email: string | null
          client_name: string
          client_phone: string | null
          commission_amount: number
          commission_rate: number
          created_at: string | null
          event_address: string | null
          event_date: string
          group_profile_id: string
          hours: number
          id: string
          musician_earnings: number
          notes: string | null
          price_per_hour: number
          status: string
          total: number
          updated_at: string | null
        }
        Insert: {
          advance_amount?: number
          advance_paid?: boolean
          client_email?: string | null
          client_name: string
          client_phone?: string | null
          commission_amount?: number
          commission_rate?: number
          created_at?: string | null
          event_address?: string | null
          event_date: string
          group_profile_id: string
          hours?: number
          id?: string
          musician_earnings?: number
          notes?: string | null
          price_per_hour?: number
          status?: string
          total?: number
          updated_at?: string | null
        }
        Update: {
          advance_amount?: number
          advance_paid?: boolean
          client_email?: string | null
          client_name?: string
          client_phone?: string | null
          commission_amount?: number
          commission_rate?: number
          created_at?: string | null
          event_address?: string | null
          event_date?: string
          group_profile_id?: string
          hours?: number
          id?: string
          musician_earnings?: number
          notes?: string | null
          price_per_hour?: number
          status?: string
          total?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_group_profile_id_fkey"
            columns: ["group_profile_id"]
            isOneToOne: false
            referencedRelation: "group_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          alt_text: string | null
          created_at: string
          id: string
          image_url: string | null
          price: string
          sort_order: number
          title: string
          visible: boolean
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          price: string
          sort_order?: number
          title: string
          visible?: boolean
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          price?: string
          sort_order?: number
          title?: string
          visible?: boolean
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          created_at: string
          event_proposal_id: string
          id: string
          message: string
          sender_id: string | null
          sender_type: string
        }
        Insert: {
          created_at?: string
          event_proposal_id: string
          id?: string
          message: string
          sender_id?: string | null
          sender_type?: string
        }
        Update: {
          created_at?: string
          event_proposal_id?: string
          id?: string
          message?: string
          sender_id?: string | null
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_event_proposal_id_fkey"
            columns: ["event_proposal_id"]
            isOneToOne: false
            referencedRelation: "event_proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      client_profiles: {
        Row: {
          avatar_url: string | null
          city: string | null
          created_at: string
          full_name: string
          id: string
          phone: string | null
          state: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          full_name: string
          id?: string
          phone?: string | null
          state?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          state?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      commission_history: {
        Row: {
          amount: number
          booking_id: string | null
          commission_rate: number
          created_at: string | null
          group_profile_id: string
          id: string
          period_month: number | null
          period_year: number | null
          status: string
        }
        Insert: {
          amount?: number
          booking_id?: string | null
          commission_rate?: number
          created_at?: string | null
          group_profile_id: string
          id?: string
          period_month?: number | null
          period_year?: number | null
          status?: string
        }
        Update: {
          amount?: number
          booking_id?: string | null
          commission_rate?: number
          created_at?: string | null
          group_profile_id?: string
          id?: string
          period_month?: number | null
          period_year?: number | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "commission_history_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_history_group_profile_id_fkey"
            columns: ["group_profile_id"]
            isOneToOne: false
            referencedRelation: "group_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      content_submissions: {
        Row: {
          admin_notes: string | null
          content: Json
          created_at: string | null
          group_profile_id: string
          id: string
          status: string
          type: string
          updated_at: string | null
        }
        Insert: {
          admin_notes?: string | null
          content?: Json
          created_at?: string | null
          group_profile_id: string
          id?: string
          status?: string
          type: string
          updated_at?: string | null
        }
        Update: {
          admin_notes?: string | null
          content?: Json
          created_at?: string | null
          group_profile_id?: string
          id?: string
          status?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_submissions_group_profile_id_fkey"
            columns: ["group_profile_id"]
            isOneToOne: false
            referencedRelation: "group_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          client_name: string
          created_at: string
          deposit_amount: number
          duration_hours: number
          event_city: string
          event_date: string
          event_proposal_id: string
          event_type: string
          group_name: string
          group_profile_id: string
          id: string
          payment_id: string
          remaining_amount: number
          service_conditions: string
          status: string
          total_amount: number
        }
        Insert: {
          client_name: string
          created_at?: string
          deposit_amount?: number
          duration_hours?: number
          event_city: string
          event_date: string
          event_proposal_id: string
          event_type?: string
          group_name: string
          group_profile_id: string
          id?: string
          payment_id: string
          remaining_amount?: number
          service_conditions?: string
          status?: string
          total_amount?: number
        }
        Update: {
          client_name?: string
          created_at?: string
          deposit_amount?: number
          duration_hours?: number
          event_city?: string
          event_date?: string
          event_proposal_id?: string
          event_type?: string
          group_name?: string
          group_profile_id?: string
          id?: string
          payment_id?: string
          remaining_amount?: number
          service_conditions?: string
          status?: string
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "contracts_event_proposal_id_fkey"
            columns: ["event_proposal_id"]
            isOneToOne: false
            referencedRelation: "event_proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_group_profile_id_fkey"
            columns: ["group_profile_id"]
            isOneToOne: false
            referencedRelation: "group_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_sections: {
        Row: {
          content: string | null
          created_at: string
          id: string
          image_url: string | null
          sort_order: number
          subtitle: string | null
          title: string
          updated_at: string
          video_url: string | null
          visible: boolean
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          sort_order?: number
          subtitle?: string | null
          title: string
          updated_at?: string
          video_url?: string | null
          visible?: boolean
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          sort_order?: number
          subtitle?: string | null
          title?: string
          updated_at?: string
          video_url?: string | null
          visible?: boolean
        }
        Relationships: []
      }
      event_proposals: {
        Row: {
          availability_confirmed: boolean
          created_at: string
          event_request_id: string
          group_profile_id: string
          id: string
          message: string | null
          price_per_hour: number | null
          price_total: number | null
          status: string
          updated_at: string
        }
        Insert: {
          availability_confirmed?: boolean
          created_at?: string
          event_request_id: string
          group_profile_id: string
          id?: string
          message?: string | null
          price_per_hour?: number | null
          price_total?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          availability_confirmed?: boolean
          created_at?: string
          event_request_id?: string
          group_profile_id?: string
          id?: string
          message?: string | null
          price_per_hour?: number | null
          price_total?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_proposals_event_request_id_fkey"
            columns: ["event_request_id"]
            isOneToOne: false
            referencedRelation: "event_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_proposals_group_profile_id_fkey"
            columns: ["group_profile_id"]
            isOneToOne: false
            referencedRelation: "group_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_requests: {
        Row: {
          budget: number
          city: string
          client_email: string | null
          client_name: string
          client_phone: string | null
          client_token: string
          client_user_id: string | null
          created_at: string
          description: string | null
          duration_hours: number
          event_address: string | null
          event_date: string
          event_type: string
          group_type: string
          id: string
          location_lat: number | null
          location_lng: number | null
          start_time: string
          state: string
          status: string
          updated_at: string
        }
        Insert: {
          budget?: number
          city: string
          client_email?: string | null
          client_name: string
          client_phone?: string | null
          client_token?: string
          client_user_id?: string | null
          created_at?: string
          description?: string | null
          duration_hours?: number
          event_address?: string | null
          event_date: string
          event_type?: string
          group_type: string
          id?: string
          location_lat?: number | null
          location_lng?: number | null
          start_time?: string
          state: string
          status?: string
          updated_at?: string
        }
        Update: {
          budget?: number
          city?: string
          client_email?: string | null
          client_name?: string
          client_phone?: string | null
          client_token?: string
          client_user_id?: string | null
          created_at?: string
          description?: string | null
          duration_hours?: number
          event_address?: string | null
          event_date?: string
          event_type?: string
          group_type?: string
          id?: string
          location_lat?: number | null
          location_lng?: number | null
          start_time?: string
          state?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      faqs: {
        Row: {
          answer: string
          created_at: string
          id: string
          question: string
          sort_order: number
          visible: boolean
        }
        Insert: {
          answer: string
          created_at?: string
          id?: string
          question: string
          sort_order?: number
          visible?: boolean
        }
        Update: {
          answer?: string
          created_at?: string
          id?: string
          question?: string
          sort_order?: number
          visible?: boolean
        }
        Relationships: []
      }
      group_media: {
        Row: {
          clip_end: number | null
          clip_start: number | null
          created_at: string
          group_profile_id: string
          id: string
          thumbnail: string | null
          title: string | null
          type: string
          updated_at: string
          uploaded_by: string
          url: string
        }
        Insert: {
          clip_end?: number | null
          clip_start?: number | null
          created_at?: string
          group_profile_id: string
          id?: string
          thumbnail?: string | null
          title?: string | null
          type: string
          updated_at?: string
          uploaded_by?: string
          url: string
        }
        Update: {
          clip_end?: number | null
          clip_start?: number | null
          created_at?: string
          group_profile_id?: string
          id?: string
          thumbnail?: string | null
          title?: string | null
          type?: string
          updated_at?: string
          uploaded_by?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_media_group_profile_id_fkey"
            columns: ["group_profile_id"]
            isOneToOne: false
            referencedRelation: "group_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      group_memberships: {
        Row: {
          billing_period: string | null
          created_at: string | null
          expires_at: string | null
          group_profile_id: string
          id: string
          plan_id: string
          starts_at: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          billing_period?: string | null
          created_at?: string | null
          expires_at?: string | null
          group_profile_id: string
          id?: string
          plan_id: string
          starts_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          billing_period?: string | null
          created_at?: string | null
          expires_at?: string | null
          group_profile_id?: string
          id?: string
          plan_id?: string
          starts_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_memberships_group_profile_id_fkey"
            columns: ["group_profile_id"]
            isOneToOne: false
            referencedRelation: "group_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_memberships_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "membership_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      group_photos: {
        Row: {
          created_at: string
          group_id: string
          id: string
          image_url: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          image_url: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          image_url?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "group_photos_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "musical_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_profiles: {
        Row: {
          admin_notes: string | null
          city: string | null
          created_at: string | null
          demo_video: string | null
          description: string | null
          group_name: string
          group_type: string
          id: string
          min_hours: number | null
          phone: string | null
          photos: Json | null
          price_per_hour: number | null
          social_media: Json | null
          state: string | null
          status: string
          updated_at: string | null
          user_id: string | null
          whatsapp: string | null
        }
        Insert: {
          admin_notes?: string | null
          city?: string | null
          created_at?: string | null
          demo_video?: string | null
          description?: string | null
          group_name: string
          group_type?: string
          id?: string
          min_hours?: number | null
          phone?: string | null
          photos?: Json | null
          price_per_hour?: number | null
          social_media?: Json | null
          state?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string | null
          whatsapp?: string | null
        }
        Update: {
          admin_notes?: string | null
          city?: string | null
          created_at?: string | null
          demo_video?: string | null
          description?: string | null
          group_name?: string
          group_type?: string
          id?: string
          min_hours?: number | null
          phone?: string | null
          photos?: Json | null
          price_per_hour?: number | null
          social_media?: Json | null
          state?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      group_videos: {
        Row: {
          created_at: string
          group_id: string
          id: string
          sort_order: number
          title: string
          video_url: string | null
          youtube_url: string | null
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          sort_order?: number
          title: string
          video_url?: string | null
          youtube_url?: string | null
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          sort_order?: number
          title?: string
          video_url?: string | null
          youtube_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_videos_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "musical_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      membership_plans: {
        Row: {
          badge: string | null
          commission_rate: number
          created_at: string | null
          features: Json | null
          highlighted: boolean | null
          id: string
          max_photos: number | null
          max_videos: number | null
          name: string
          price_annual: number
          price_monthly: number
          sort_order: number | null
          tier: string
          updated_at: string | null
          visible: boolean | null
        }
        Insert: {
          badge?: string | null
          commission_rate?: number
          created_at?: string | null
          features?: Json | null
          highlighted?: boolean | null
          id?: string
          max_photos?: number | null
          max_videos?: number | null
          name: string
          price_annual?: number
          price_monthly?: number
          sort_order?: number | null
          tier?: string
          updated_at?: string | null
          visible?: boolean | null
        }
        Update: {
          badge?: string | null
          commission_rate?: number
          created_at?: string | null
          features?: Json | null
          highlighted?: boolean | null
          id?: string
          max_photos?: number | null
          max_videos?: number | null
          name?: string
          price_annual?: number
          price_monthly?: number
          sort_order?: number | null
          tier?: string
          updated_at?: string | null
          visible?: boolean | null
        }
        Relationships: []
      }
      musical_groups: {
        Row: {
          badge: string | null
          badge_color: string | null
          category_id: string | null
          city: string | null
          created_at: string
          description: string | null
          featured: boolean
          group_profile_id: string | null
          id: string
          image_url: string | null
          name: string
          price: string
          sort_order: number
          state: string | null
          visible: boolean
        }
        Insert: {
          badge?: string | null
          badge_color?: string | null
          category_id?: string | null
          city?: string | null
          created_at?: string
          description?: string | null
          featured?: boolean
          group_profile_id?: string | null
          id?: string
          image_url?: string | null
          name: string
          price: string
          sort_order?: number
          state?: string | null
          visible?: boolean
        }
        Update: {
          badge?: string | null
          badge_color?: string | null
          category_id?: string | null
          city?: string | null
          created_at?: string
          description?: string | null
          featured?: boolean
          group_profile_id?: string | null
          id?: string
          image_url?: string | null
          name?: string
          price?: string
          sort_order?: number
          state?: string | null
          visible?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "musical_groups_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "musical_groups_group_profile_id_fkey"
            columns: ["group_profile_id"]
            isOneToOne: false
            referencedRelation: "group_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      package_photos: {
        Row: {
          created_at: string
          id: string
          image_url: string
          package_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          package_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          package_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "package_photos_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "sound_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      package_videos: {
        Row: {
          created_at: string
          id: string
          package_id: string
          sort_order: number
          title: string
          video_url: string | null
          youtube_url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          package_id: string
          sort_order?: number
          title?: string
          video_url?: string | null
          youtube_url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          package_id?: string
          sort_order?: number
          title?: string
          video_url?: string | null
          youtube_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "package_videos_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "sound_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          client_name: string | null
          commission_rate: number
          created_at: string
          event_proposal_id: string
          group_profile_id: string
          id: string
          payment_method: string
          status: string
          total_service: number
        }
        Insert: {
          amount?: number
          client_name?: string | null
          commission_rate?: number
          created_at?: string
          event_proposal_id: string
          group_profile_id: string
          id?: string
          payment_method?: string
          status?: string
          total_service?: number
        }
        Update: {
          amount?: number
          client_name?: string | null
          commission_rate?: number
          created_at?: string
          event_proposal_id?: string
          group_profile_id?: string
          id?: string
          payment_method?: string
          status?: string
          total_service?: number
        }
        Relationships: [
          {
            foreignKeyName: "payments_event_proposal_id_fkey"
            columns: ["event_proposal_id"]
            isOneToOne: false
            referencedRelation: "event_proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_group_profile_id_fkey"
            columns: ["group_profile_id"]
            isOneToOne: false
            referencedRelation: "group_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reel_comment_likes: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reel_comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "reel_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      reel_comments: {
        Row: {
          comment: string
          created_at: string
          display_name: string
          id: string
          media_id: string
          parent_id: string | null
          user_id: string
        }
        Insert: {
          comment: string
          created_at?: string
          display_name?: string
          id?: string
          media_id: string
          parent_id?: string | null
          user_id: string
        }
        Update: {
          comment?: string
          created_at?: string
          display_name?: string
          id?: string
          media_id?: string
          parent_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reel_comments_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "group_media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reel_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "reel_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      reel_likes: {
        Row: {
          created_at: string
          id: string
          media_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          media_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          media_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reel_likes_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "group_media"
            referencedColumns: ["id"]
          },
        ]
      }
      section_order: {
        Row: {
          id: string
          label: string
          section_key: string
          sort_order: number
          updated_at: string
          visible: boolean
        }
        Insert: {
          id?: string
          label: string
          section_key: string
          sort_order?: number
          updated_at?: string
          visible?: boolean
        }
        Update: {
          id?: string
          label?: string
          section_key?: string
          sort_order?: number
          updated_at?: string
          visible?: boolean
        }
        Relationships: []
      }
      site_content: {
        Row: {
          id: string
          key: string
          section: string
          sort_order: number
          type: string
          updated_at: string
          value: string
        }
        Insert: {
          id?: string
          key: string
          section: string
          sort_order?: number
          type?: string
          updated_at?: string
          value?: string
        }
        Update: {
          id?: string
          key?: string
          section?: string
          sort_order?: number
          type?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      sound_packages: {
        Row: {
          badge: string | null
          capacity: string | null
          created_at: string
          description: string | null
          features: Json
          id: string
          image_url: string | null
          name: string
          price: number
          sort_order: number
          updated_at: string
          visible: boolean
        }
        Insert: {
          badge?: string | null
          capacity?: string | null
          created_at?: string
          description?: string | null
          features?: Json
          id?: string
          image_url?: string | null
          name: string
          price?: number
          sort_order?: number
          updated_at?: string
          visible?: boolean
        }
        Update: {
          badge?: string | null
          capacity?: string | null
          created_at?: string
          description?: string | null
          features?: Json
          id?: string
          image_url?: string | null
          name?: string
          price?: number
          sort_order?: number
          updated_at?: string
          visible?: boolean
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          created_at: string
          event_type: string | null
          id: string
          name: string
          photo_url: string | null
          rating: number
          sort_order: number
          text: string
          visible: boolean
        }
        Insert: {
          created_at?: string
          event_type?: string | null
          id?: string
          name: string
          photo_url?: string | null
          rating?: number
          sort_order?: number
          text: string
          visible?: boolean
        }
        Update: {
          created_at?: string
          event_type?: string | null
          id?: string
          name?: string
          photo_url?: string | null
          rating?: number
          sort_order?: number
          text?: string
          visible?: boolean
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_expired_memberships: { Args: never; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "group" | "client"
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
      app_role: ["admin", "group", "client"],
    },
  },
} as const
