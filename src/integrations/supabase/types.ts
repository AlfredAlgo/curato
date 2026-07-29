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
      follows: {
        Row: {
          created_at: string
          followed_id: string
          follower_id: string
          id: string
        }
        Insert: {
          created_at?: string
          followed_id: string
          follower_id: string
          id?: string
        }
        Update: {
          created_at?: string
          followed_id?: string
          follower_id?: string
          id?: string
        }
        Relationships: []
      }
      track_saves: {
        Row: {
          created_at: string
          id: string
          track_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          track_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          track_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "track_saves_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_products: {
        Row: {
          category: Database["public"]["Enums"]["shop_category"]
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          is_curator_pick: boolean
          price_cents: number
          seller_id: string | null
          seller_type: Database["public"]["Enums"]["seller_type"]
          title: string
          updated_at: string
        }
        Insert: {
          category: Database["public"]["Enums"]["shop_category"]
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_curator_pick?: boolean
          price_cents: number
          seller_id?: string | null
          seller_type?: Database["public"]["Enums"]["seller_type"]
          title: string
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["shop_category"]
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_curator_pick?: boolean
          price_cents?: number
          seller_id?: string | null
          seller_type?: Database["public"]["Enums"]["seller_type"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      opportunities: {
        Row: {
          company_name: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          link_url: string | null
          reward_details: string | null
          title: string
          type: Database["public"]["Enums"]["opportunity_type"]
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          link_url?: string | null
          reward_details?: string | null
          title: string
          type: Database["public"]["Enums"]["opportunity_type"]
        }
        Update: {
          company_name?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          link_url?: string | null
          reward_details?: string | null
          title?: string
          type?: Database["public"]["Enums"]["opportunity_type"]
        }
        Relationships: []
      }
      opportunity_interests: {
        Row: {
          created_at: string
          id: string
          opportunity_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          opportunity_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          opportunity_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_interests_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          room: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          room: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          room?: string
          user_id?: string
        }
        Relationships: []
      }
      feedback: {
        Row: {
          commercial_potential: number | null
          created_at: string
          id: string
          is_public: boolean
          notes: string | null
          originality: number | null
          production_quality: number | null
          rating: number | null
          reviewer_id: string
          track_id: string
          updated_at: string
        }
        Insert: {
          commercial_potential?: number | null
          created_at?: string
          id?: string
          is_public?: boolean
          notes?: string | null
          originality?: number | null
          production_quality?: number | null
          rating?: number | null
          reviewer_id: string
          track_id: string
          updated_at?: string
        }
        Update: {
          commercial_potential?: number | null
          created_at?: string
          id?: string
          is_public?: boolean
          notes?: string | null
          originality?: number | null
          production_quality?: number | null
          rating?: number | null
          reviewer_id?: string
          track_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          message: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          message: string
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          message?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      pool_tracks: {
        Row: {
          added_at: string
          added_by: string
          id: string
          pool_id: string
          position: number | null
          track_id: string
        }
        Insert: {
          added_at?: string
          added_by: string
          id?: string
          pool_id: string
          position?: number | null
          track_id: string
        }
        Update: {
          added_at?: string
          added_by?: string
          id?: string
          pool_id?: string
          position?: number | null
          track_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pool_tracks_pool_id_fkey"
            columns: ["pool_id"]
            isOneToOne: false
            referencedRelation: "test_pools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pool_tracks_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          contact_number: string | null
          created_at: string
          display_name: string | null
          gender: string | null
          id: string
          id_number: string | null
          location: string | null
          referral_code: string | null
          residential_address: string | null
          stage_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          contact_number?: string | null
          created_at?: string
          display_name?: string | null
          gender?: string | null
          id?: string
          id_number?: string | null
          location?: string | null
          referral_code?: string | null
          residential_address?: string | null
          stage_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          contact_number?: string | null
          created_at?: string
          display_name?: string | null
          gender?: string | null
          id?: string
          id_number?: string | null
          location?: string | null
          referral_code?: string | null
          residential_address?: string | null
          stage_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      test_pools: {
        Row: {
          created_at: string
          curator_id: string
          description: string | null
          id: string
          is_active: boolean
          max_tracks: number | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          curator_id: string
          description?: string | null
          id?: string
          is_active?: boolean
          max_tracks?: number | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          curator_id?: string
          description?: string | null
          id?: string
          is_active?: boolean
          max_tracks?: number | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      track_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          track_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          track_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          track_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "track_comments_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      track_likes: {
        Row: {
          created_at: string
          id: string
          track_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          track_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          track_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "track_likes_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      track_shares: {
        Row: {
          created_at: string
          id: string
          track_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          track_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          track_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "track_shares_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      tracks: {
        Row: {
          artist_name: string
          created_at: string
          duration_seconds: number | null
          external_link: string | null
          file_url: string | null
          genre: string | null
          id: string
          platform: string | null
          snippet_url: string | null
          status: string
          submission_type: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          artist_name: string
          created_at?: string
          duration_seconds?: number | null
          external_link?: string | null
          file_url?: string | null
          genre?: string | null
          id?: string
          platform?: string | null
          snippet_url?: string | null
          status?: string
          submission_type: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          artist_name?: string
          created_at?: string
          duration_seconds?: number | null
          external_link?: string | null
          file_url?: string | null
          genre?: string | null
          id?: string
          platform?: string | null
          snippet_url?: string | null
          status?: string
          submission_type?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      get_track_engagement: { Args: { p_track_id: string }; Returns: number }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "super_curator" | "curator" | "artist" | "listener" | "producer"
      shop_category: "sound_pack" | "plugin" | "merch" | "producer_item"
      seller_type: "official" | "curator" | "producer"
      opportunity_type: "sponsorship" | "brand_partnership" | "event" | "affiliate"
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
      app_role: ["admin", "super_curator", "curator", "artist", "listener", "producer"],
      shop_category: ["sound_pack", "plugin", "merch", "producer_item"],
      seller_type: ["official", "curator", "producer"],
      opportunity_type: ["sponsorship", "brand_partnership", "event", "affiliate"],
    },
  },
} as const
