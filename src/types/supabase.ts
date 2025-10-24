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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      api_keys: {
        Row: {
          created_at: string | null
          created_by: string
          expires_at: string | null
          id: string
          is_active: boolean | null
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          metadata: Json | null
          name: string
          rate_limit: number
          revoked_at: string | null
          revoked_by: string | null
          scopes: Json | null
          tenant_id: string
          website_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          metadata?: Json | null
          name: string
          rate_limit?: number
          revoked_at?: string | null
          revoked_by?: string | null
          scopes?: Json | null
          tenant_id: string
          website_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          metadata?: Json | null
          name?: string
          rate_limit?: number
          revoked_at?: string | null
          revoked_by?: string | null
          scopes?: Json | null
          tenant_id?: string
          website_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_keys_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_keys_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: false
            referencedRelation: "cms_websites"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          target_user_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          target_user_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          target_user_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      cms_collection_entries: {
        Row: {
          collection_id: string
          created_at: string
          id: string
          name: string | null
        }
        Insert: {
          collection_id: string
          created_at?: string
          id?: string
          name?: string | null
        }
        Update: {
          collection_id?: string
          created_at?: string
          id?: string
          name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cms_collection_groups_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "cms_collections"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_collections: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          schema_id: string | null
          website_id: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          schema_id?: string | null
          website_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          schema_id?: string | null
          website_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cms_collections_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cms_collections_schema_id_fkey"
            columns: ["schema_id"]
            isOneToOne: false
            referencedRelation: "cms_schemas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cms_collections_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: false
            referencedRelation: "cms_websites"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_collections_items: {
        Row: {
          cms_collection_entry_id: string
          collection_id: string
          content: Json | null
          created_at: string
          created_by: string | null
          field_type: Database["public"]["Enums"]["field_type"] | null
          id: string
          name: string | null
          order: number
          parent_field_id: string | null
          schema_field_id: string
          updated_at: string | null
        }
        Insert: {
          cms_collection_entry_id: string
          collection_id: string
          content?: Json | null
          created_at?: string
          created_by?: string | null
          field_type?: Database["public"]["Enums"]["field_type"] | null
          id?: string
          name?: string | null
          order?: number
          parent_field_id?: string | null
          schema_field_id: string
          updated_at?: string | null
        }
        Update: {
          cms_collection_entry_id?: string
          collection_id?: string
          content?: Json | null
          created_at?: string
          created_by?: string | null
          field_type?: Database["public"]["Enums"]["field_type"] | null
          id?: string
          name?: string | null
          order?: number
          parent_field_id?: string | null
          schema_field_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cms_collections_items_cms_collection_entry_id_fkey"
            columns: ["cms_collection_entry_id"]
            isOneToOne: false
            referencedRelation: "cms_collection_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cms_collections_items_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "cms_collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cms_collections_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cms_collections_items_parent_field_id_fkey"
            columns: ["parent_field_id"]
            isOneToOne: false
            referencedRelation: "cms_collections_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cms_collections_items_schema_field_id_fkey"
            columns: ["schema_field_id"]
            isOneToOne: false
            referencedRelation: "cms_schema_fields"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_content_fields: {
        Row: {
          collection_id: string | null
          content: Json | null
          created_at: string | null
          id: string
          name: string
          order: number | null
          parent_field_id: string | null
          schema_field_id: string
          section_id: string
          type: Database["public"]["Enums"]["field_type"]
          updated_at: string | null
        }
        Insert: {
          collection_id?: string | null
          content?: Json | null
          created_at?: string | null
          id?: string
          name: string
          order?: number | null
          parent_field_id?: string | null
          schema_field_id: string
          section_id: string
          type: Database["public"]["Enums"]["field_type"]
          updated_at?: string | null
        }
        Update: {
          collection_id?: string | null
          content?: Json | null
          created_at?: string | null
          id?: string
          name?: string
          order?: number | null
          parent_field_id?: string | null
          schema_field_id?: string
          section_id?: string
          type?: Database["public"]["Enums"]["field_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cms_content_fields_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "cms_collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cms_content_fields_schema_field_id_fkey"
            columns: ["schema_field_id"]
            isOneToOne: false
            referencedRelation: "cms_schema_fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cms_fields_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "cms_content_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_content_sections: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          order: number | null
          page_id: string | null
          schema_section_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          order?: number | null
          page_id?: string | null
          schema_section_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          order?: number | null
          page_id?: string | null
          schema_section_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cms_content_sections_schema_section_id_fkey"
            columns: ["schema_section_id"]
            isOneToOne: false
            referencedRelation: "cms_schema_sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cms_sections_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "cms_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_pages: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          schema_id: string
          slug: string
          status: Database["public"]["Enums"]["page_status"] | null
          tenant_id: string
          updated_at: string | null
          website_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          schema_id: string
          slug: string
          status?: Database["public"]["Enums"]["page_status"] | null
          tenant_id: string
          updated_at?: string | null
          website_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          schema_id?: string
          slug?: string
          status?: Database["public"]["Enums"]["page_status"] | null
          tenant_id?: string
          updated_at?: string | null
          website_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cms_pages_schema_id_fkey"
            columns: ["schema_id"]
            isOneToOne: false
            referencedRelation: "cms_schemas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cms_pages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cms_pages_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: false
            referencedRelation: "cms_websites"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_schema_fields: {
        Row: {
          collection_id: string | null
          created_at: string
          default_value: string | null
          id: string
          name: string
          order: number
          parent_field_id: string | null
          required: boolean
          schema_section_id: string
          type: Database["public"]["Enums"]["field_type"]
          updated_at: string
          validation: string | null
        }
        Insert: {
          collection_id?: string | null
          created_at?: string
          default_value?: string | null
          id?: string
          name: string
          order?: number
          parent_field_id?: string | null
          required?: boolean
          schema_section_id: string
          type: Database["public"]["Enums"]["field_type"]
          updated_at?: string
          validation?: string | null
        }
        Update: {
          collection_id?: string | null
          created_at?: string
          default_value?: string | null
          id?: string
          name?: string
          order?: number
          parent_field_id?: string | null
          required?: boolean
          schema_section_id?: string
          type?: Database["public"]["Enums"]["field_type"]
          updated_at?: string
          validation?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cms_schema_fields_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "cms_collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cms_schema_fields_parent_field_id_fkey"
            columns: ["parent_field_id"]
            isOneToOne: false
            referencedRelation: "cms_schema_fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cms_schema_fields_schema_section_id_fkey"
            columns: ["schema_section_id"]
            isOneToOne: false
            referencedRelation: "cms_schema_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_schema_sections: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          order: number | null
          schema_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          order?: number | null
          schema_id?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          order?: number | null
          schema_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cms_schema_sections_schema_id_fkey"
            columns: ["schema_id"]
            isOneToOne: false
            referencedRelation: "cms_schemas"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_schemas: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          schema_type: Database["public"]["Enums"]["schema_type"]
          template: boolean
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          schema_type?: Database["public"]["Enums"]["schema_type"]
          template?: boolean
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          schema_type?: Database["public"]["Enums"]["schema_type"]
          template?: boolean
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cms_schemas_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cms_schemas_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_websites: {
        Row: {
          created_at: string | null
          description: string | null
          domain: string
          id: string
          name: string
          status: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          domain: string
          id?: string
          name: string
          status?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          domain?: string
          id?: string
          name?: string
          status?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cms_websites_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      email_logs: {
        Row: {
          error_message: string | null
          html_body: string | null
          id: string
          message_id: string | null
          origin: string
          sent_at: string
          status: string
          subject: string
          text_body: string | null
          to_address: string
        }
        Insert: {
          error_message?: string | null
          html_body?: string | null
          id?: string
          message_id?: string | null
          origin?: string
          sent_at?: string
          status: string
          subject: string
          text_body?: string | null
          to_address: string
        }
        Update: {
          error_message?: string | null
          html_body?: string | null
          id?: string
          message_id?: string | null
          origin?: string
          sent_at?: string
          status?: string
          subject?: string
          text_body?: string | null
          to_address?: string
        }
        Relationships: []
      }
      files: {
        Row: {
          alt_text: string | null
          created_at: string | null
          deleted_at: string | null
          description: string | null
          download_count: number | null
          file_type: string
          filename: string
          folder: string | null
          height: number | null
          id: string
          last_accessed_at: string | null
          mime_type: string
          original_filename: string
          size_bytes: number
          storage_bucket: string
          storage_path: string
          tags: string[] | null
          tenant_id: string
          updated_at: string | null
          uploaded_by: string
          used_in_fields: string[] | null
          website_id: string | null
          width: number | null
        }
        Insert: {
          alt_text?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          download_count?: number | null
          file_type: string
          filename: string
          folder?: string | null
          height?: number | null
          id?: string
          last_accessed_at?: string | null
          mime_type: string
          original_filename: string
          size_bytes: number
          storage_bucket?: string
          storage_path: string
          tags?: string[] | null
          tenant_id: string
          updated_at?: string | null
          uploaded_by: string
          used_in_fields?: string[] | null
          website_id?: string | null
          width?: number | null
        }
        Update: {
          alt_text?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          download_count?: number | null
          file_type?: string
          filename?: string
          folder?: string | null
          height?: number | null
          id?: string
          last_accessed_at?: string | null
          mime_type?: string
          original_filename?: string
          size_bytes?: number
          storage_bucket?: string
          storage_path?: string
          tags?: string[] | null
          tenant_id?: string
          updated_at?: string | null
          uploaded_by?: string
          used_in_fields?: string[] | null
          website_id?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "files_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "files_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "files_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: false
            referencedRelation: "cms_websites"
            referencedColumns: ["id"]
          },
        ]
      }
      global_role_types: {
        Row: {
          description: string
          id: string
          role_name: string
        }
        Insert: {
          description: string
          id?: string
          role_name: string
        }
        Update: {
          description?: string
          id?: string
          role_name?: string
        }
        Relationships: []
      }
      moneybird: {
        Row: {
          access_token: string
          created_at: string
          id: string
          refresh_token: string
        }
        Insert: {
          access_token: string
          created_at?: string
          id?: string
          refresh_token: string
        }
        Update: {
          access_token?: string
          created_at?: string
          id?: string
          refresh_token?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          canceled_at: string | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          ended_at: string | null
          id: string
          metadata: Json | null
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_price_id: string | null
          stripe_product_id: string | null
          stripe_subscription_id: string
          tenant_id: string
          trial_end: string | null
          trial_start: string | null
          updated_at: string | null
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          ended_at?: string | null
          id?: string
          metadata?: Json | null
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          stripe_subscription_id: string
          tenant_id: string
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string | null
        }
        Update: {
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          ended_at?: string | null
          id?: string
          metadata?: Json | null
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          stripe_subscription_id?: string
          tenant_id?: string
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          address: string | null
          address2: string | null
          billing_slug: string | null
          business_type: string
          city: string | null
          contact_email: string | null
          country: string | null
          created_at: string | null
          id: string
          kvk_number: string | null
          logo_url: string | null
          moneybird_contact_id: string | null
          name: string
          notes: string | null
          pax8_customer_id: string | null
          phone: string | null
          postal_code: string | null
          primary_contact_user_id: string | null
          state_or_province: string | null
          storage_quota_bytes: number | null
          storage_quota_exceeded_at: string | null
          storage_used_bytes: number | null
          stripe_customer_id: string | null
          updated_at: string | null
          vat_number: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          address2?: string | null
          billing_slug?: string | null
          business_type: string
          city?: string | null
          contact_email?: string | null
          country?: string | null
          created_at?: string | null
          id?: string
          kvk_number?: string | null
          logo_url?: string | null
          moneybird_contact_id?: string | null
          name: string
          notes?: string | null
          pax8_customer_id?: string | null
          phone?: string | null
          postal_code?: string | null
          primary_contact_user_id?: string | null
          state_or_province?: string | null
          storage_quota_bytes?: number | null
          storage_quota_exceeded_at?: string | null
          storage_used_bytes?: number | null
          stripe_customer_id?: string | null
          updated_at?: string | null
          vat_number?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          address2?: string | null
          billing_slug?: string | null
          business_type?: string
          city?: string | null
          contact_email?: string | null
          country?: string | null
          created_at?: string | null
          id?: string
          kvk_number?: string | null
          logo_url?: string | null
          moneybird_contact_id?: string | null
          name?: string
          notes?: string | null
          pax8_customer_id?: string | null
          phone?: string | null
          postal_code?: string | null
          primary_contact_user_id?: string | null
          state_or_province?: string | null
          storage_quota_bytes?: number | null
          storage_quota_exceeded_at?: string | null
          storage_used_bytes?: number | null
          stripe_customer_id?: string | null
          updated_at?: string | null
          vat_number?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenants_primary_contact_user_id_fkey"
            columns: ["primary_contact_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_global_roles: {
        Row: {
          created_at: string | null
          description: string | null
          global_role_type_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          global_role_type_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          global_role_type_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_global_roles_global_role_type_id_fkey"
            columns: ["global_role_type_id"]
            isOneToOne: false
            referencedRelation: "global_role_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_global_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_tenants: {
        Row: {
          created_at: string | null
          id: string
          role: string | null
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: string | null
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string | null
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_tenants_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_tenants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar: string | null
          created_at: string
          email: string
          first_name: string | null
          id: string
          is_onboarded: boolean
          last_name: string | null
          updated_at: string
        }
        Insert: {
          avatar?: string | null
          created_at?: string
          email: string
          first_name?: string | null
          id?: string
          is_onboarded?: boolean
          last_name?: string | null
          updated_at?: string
        }
        Update: {
          avatar?: string | null
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          is_onboarded?: boolean
          last_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      build_nested_content_fields_recursive: {
        Args: { parent_field_id_param?: string; section_id_param: string }
        Returns: Json
      }
      build_nested_fields_recursive: {
        Args: { parent_field_id_param?: string; section_id_param: string }
        Returns: Json
      }
      build_schema_fields_with_content: {
        Args: {
          page_id_param: string
          parent_field_id_param?: string
          schema_section_id_param: string
        }
        Returns: Json
      }
      calculate_tenant_storage: {
        Args: { p_tenant_id: string }
        Returns: number
      }
      can_tenant_upload_file: {
        Args: { p_file_size: number; p_tenant_id: string }
        Returns: boolean
      }
      create_user_profile_and_assign_role: {
        Args: {
          p_email: string
          p_first_name: string
          p_last_name: string
          p_role_type_id: string
          p_user_id: string
        }
        Returns: boolean
      }
      format_file_size: { Args: { size_bytes: number }; Returns: string }
      get_all_users_with_roles: { Args: never; Returns: Json[] }
      get_collection_with_schema: {
        Args: { p_collection_id: string; p_tenant_id: string }
        Returns: Json
      }
      get_file_extension: { Args: { filename: string }; Returns: string }
      get_file_type: { Args: { mime_type: string }; Returns: string }
      get_or_create_content_section: {
        Args: { page_id_param: string; schema_section_id_param: string }
        Returns: string
      }
      get_page: {
        Args: { page_id_param: string }
        Returns: {
          created_at: string
          description: string
          id: string
          name: string
          schema_description: string
          schema_id: string
          schema_name: string
          schema_template: boolean
          sections: Json
          slug: string
          status: Database["public"]["Enums"]["page_status"]
          updated_at: string
          website_id: string
        }[]
      }
      get_page_content: {
        Args: { page_id_param: string; website_id_param: string }
        Returns: {
          id: string
          sections: Json
          slug: string
        }[]
      }
      get_user_session:
        | { Args: { p_uid: string }; Returns: Json }
        | { Args: never; Returns: Json }
      has_global_role:
        | { Args: { role_name_input: string; uid: string }; Returns: boolean }
        | { Args: { role_name_input: string }; Returns: boolean }
      initialize_collection_entry_content: {
        Args: {
          collection_id_param: string
          entry_id_param: string
          schema_id_param: string
        }
        Returns: undefined
      }
      initialize_page_content: {
        Args: { page_id_param: string; schema_id_param: string }
        Returns: undefined
      }
      migrate_existing_content_to_schemas: { Args: never; Returns: undefined }
      revoke_global_role: {
        Args: { role_name_input: string; user_id_input: string }
        Returns: undefined
      }
      save_page_content: {
        Args: { field_updates: Json; page_id_param: string }
        Returns: undefined
      }
      set_system_admin: { Args: { user_id_input: string }; Returns: undefined }
      sync_schema_changes: {
        Args: { schema_id_param: string }
        Returns: {
          changes_applied: number
          updated_id: string
          updated_name: string
          updated_type: string
        }[]
      }
    }
    Enums: {
      field_type:
        | "text"
        | "number"
        | "boolean"
        | "date"
        | "richtext"
        | "image"
        | "reference"
        | "section"
        | "video"
      global_roles: "default_user" | "system_admin"
      page_status: "draft" | "active" | "archived"
      schema_type: "page" | "collection"
      subscription_status:
        | "trialing"
        | "active"
        | "past_due"
        | "canceled"
        | "unpaid"
        | "incomplete"
        | "incomplete_expired"
        | "ended"
        | "paused"
    }
    CompositeTypes: {
      cms_role_type: {
        id: string | null
        role: string | null
      }
      tenant_role_type: {
        tenant_id: string | null
        tenant_role: string | null
      }
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
      field_type: [
        "text",
        "number",
        "boolean",
        "date",
        "richtext",
        "image",
        "reference",
        "section",
        "video",
      ],
      global_roles: ["default_user", "system_admin"],
      page_status: ["draft", "active", "archived"],
      schema_type: ["page", "collection"],
      subscription_status: [
        "trialing",
        "active",
        "past_due",
        "canceled",
        "unpaid",
        "incomplete",
        "incomplete_expired",
        "ended",
        "paused",
      ],
    },
  },
} as const
