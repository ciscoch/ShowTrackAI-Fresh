/**
 * Supabase Client Configuration for ShowTrackAI
 * Provides configured Supabase clients for different use cases
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../../../src/core/config/environment';

// Database type definitions (generated from Supabase)
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          role: 'student' | 'educator' | 'veterinarian' | 'admin' | 'parent';
          subscription_tier: 'freemium' | 'elite';
          avatar_url: string | null;
          phone: string | null;
          address: string | null;
          organization_id: string | null;
          created_at: string;
          updated_at: string;
          metadata: any;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          role?: 'student' | 'educator' | 'veterinarian' | 'admin' | 'parent';
          subscription_tier?: 'freemium' | 'elite';
          avatar_url?: string | null;
          phone?: string | null;
          address?: string | null;
          organization_id?: string | null;
          metadata?: any;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          role?: 'student' | 'educator' | 'veterinarian' | 'admin' | 'parent';
          subscription_tier?: 'freemium' | 'elite';
          avatar_url?: string | null;
          phone?: string | null;
          address?: string | null;
          organization_id?: string | null;
          metadata?: any;
        };
      };
      animals: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          species: 'cattle' | 'sheep' | 'swine' | 'goats' | 'poultry' | 'other';
          breed: string | null;
          sex: string | null;
          birth_date: string | null;
          registration_number: string | null;
          ear_tag: string | null;
          microchip_id: string | null;
          current_weight: number | null;
          target_weight: number | null;
          health_status: 'healthy' | 'minor_concern' | 'needs_attention' | 'critical';
          notes: string | null;
          metadata: any;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          species: 'cattle' | 'sheep' | 'swine' | 'goats' | 'poultry' | 'other';
          breed?: string | null;
          sex?: string | null;
          birth_date?: string | null;
          registration_number?: string | null;
          ear_tag?: string | null;
          microchip_id?: string | null;
          current_weight?: number | null;
          target_weight?: number | null;
          health_status?: 'healthy' | 'minor_concern' | 'needs_attention' | 'critical';
          notes?: string | null;
          metadata?: any;
        };
        Update: {
          id?: string;
          owner_id?: string;
          name?: string;
          species?: 'cattle' | 'sheep' | 'swine' | 'goats' | 'poultry' | 'other';
          breed?: string | null;
          sex?: string | null;
          birth_date?: string | null;
          registration_number?: string | null;
          ear_tag?: string | null;
          microchip_id?: string | null;
          current_weight?: number | null;
          target_weight?: number | null;
          health_status?: 'healthy' | 'minor_concern' | 'needs_attention' | 'critical';
          notes?: string | null;
          metadata?: any;
        };
      };
      animal_weights: {
        Row: {
          id: string;
          animal_id: string;
          weight: number;
          measurement_method: string | null;
          confidence_score: number | null;
          photo_id: string | null;
          notes: string | null;
          measured_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          animal_id: string;
          weight: number;
          measurement_method?: string | null;
          confidence_score?: number | null;
          photo_id?: string | null;
          notes?: string | null;
          measured_at?: string;
        };
        Update: {
          id?: string;
          animal_id?: string;
          weight?: number;
          measurement_method?: string | null;
          confidence_score?: number | null;
          photo_id?: string | null;
          notes?: string | null;
          measured_at?: string;
        };
      };
      animal_health_records: {
        Row: {
          id: string;
          animal_id: string;
          recorded_by: string;
          health_event_type: string;
          description: string;
          severity: string | null;
          treatment: string | null;
          follow_up_required: boolean | null;
          follow_up_date: string | null;
          veterinarian_id: string | null;
          cost: number | null;
          notes: string | null;
          metadata: any;
          occurred_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          animal_id: string;
          recorded_by: string;
          health_event_type: string;
          description: string;
          severity?: string | null;
          treatment?: string | null;
          follow_up_required?: boolean | null;
          follow_up_date?: string | null;
          veterinarian_id?: string | null;
          cost?: number | null;
          notes?: string | null;
          metadata?: any;
          occurred_at?: string;
        };
        Update: {
          id?: string;
          animal_id?: string;
          recorded_by?: string;
          health_event_type?: string;
          description?: string;
          severity?: string | null;
          treatment?: string | null;
          follow_up_required?: boolean | null;
          follow_up_date?: string | null;
          veterinarian_id?: string | null;
          cost?: number | null;
          notes?: string | null;
          metadata?: any;
          occurred_at?: string;
        };
      };
      journal_entries: {
        Row: {
          id: string;
          author_id: string;
          animal_id: string | null;
          title: string;
          content: string;
          entry_type: string | null;
          tags: string[] | null;
          is_private: boolean | null;
          metadata: any;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          author_id: string;
          animal_id?: string | null;
          title: string;
          content: string;
          entry_type?: string | null;
          tags?: string[] | null;
          is_private?: boolean | null;
          metadata?: any;
        };
        Update: {
          id?: string;
          author_id?: string;
          animal_id?: string | null;
          title?: string;
          content?: string;
          entry_type?: string | null;
          tags?: string[] | null;
          is_private?: boolean | null;
          metadata?: any;
        };
      };
      expenses: {
        Row: {
          id: string;
          user_id: string;
          animal_id: string | null;
          category: string;
          subcategory: string | null;
          amount: number;
          description: string;
          vendor: string | null;
          receipt_url: string | null;
          tax_deductible: boolean | null;
          metadata: any;
          expense_date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          animal_id?: string | null;
          category: string;
          subcategory?: string | null;
          amount: number;
          description: string;
          vendor?: string | null;
          receipt_url?: string | null;
          tax_deductible?: boolean | null;
          metadata?: any;
          expense_date: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          animal_id?: string | null;
          category?: string;
          subcategory?: string | null;
          amount?: number;
          description?: string;
          vendor?: string | null;
          receipt_url?: string | null;
          tax_deductible?: boolean | null;
          metadata?: any;
          expense_date?: string;
        };
      };
      // Add more table definitions as needed
    };
    Views: {
      // Define views if any
    };
    Functions: {
      // Define RPC functions
      is_educator_for_student: {
        Args: {
          student_user_id: string;
          educator_user_id: string;
        };
        Returns: boolean;
      };
      has_token_access: {
        Args: {
          token_value: string;
          data_type: string;
        };
        Returns: boolean;
      };
      get_user_role: {
        Args: {
          user_id: string;
        };
        Returns: 'student' | 'educator' | 'veterinarian' | 'admin' | 'parent';
      };
    };
    Enums: {
      user_role: 'student' | 'educator' | 'veterinarian' | 'admin' | 'parent';
      subscription_tier: 'freemium' | 'elite';
      animal_species: 'cattle' | 'sheep' | 'swine' | 'goats' | 'poultry' | 'other';
      consultation_status: 'requested' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
      health_status: 'healthy' | 'minor_concern' | 'needs_attention' | 'critical';
    };
    CompositeTypes: {
      // Define composite types if any
    };
  };
}

// Supabase client for client-side operations (with RLS)
let supabaseClient: SupabaseClient<Database> | null = null;

export const getSupabaseClient = (): SupabaseClient<Database> => {
  if (!supabaseClient) {
    if (!config.supabase.url || !config.supabase.anonKey) {
      throw new Error('Supabase configuration is missing. Please check your environment variables.');
    }
    
    supabaseClient = createClient<Database>(
      config.supabase.url,
      config.supabase.anonKey,
      {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
        realtime: {
          params: {
            eventsPerSecond: 10,
          },
        },
        global: {
          headers: {
            'X-Client-Info': `showtrackai-mobile/${config.app.version}`,
          },
        },
      }
    );
  }
  
  return supabaseClient;
};

// Supabase client for server-side operations (bypassing RLS)
let supabaseAdmin: SupabaseClient<Database> | null = null;

export const getSupabaseAdmin = (): SupabaseClient<Database> => {
  if (!supabaseAdmin) {
    if (!config.supabase.url || !config.supabase.serviceRoleKey) {
      throw new Error('Supabase admin configuration is missing. Service role key is required.');
    }
    
    supabaseAdmin = createClient<Database>(
      config.supabase.url,
      config.supabase.serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
        global: {
          headers: {
            'X-Client-Info': `showtrackai-admin/${config.app.version}`,
          },
        },
      }
    );
  }
  
  return supabaseAdmin;
};

// Storage bucket names
export const STORAGE_BUCKETS = {
  ANIMAL_PHOTOS: 'animal-photos',
  JOURNAL_PHOTOS: 'journal-photos',
  MEDICAL_DOCUMENTS: 'medical-documents',
  PROFILE_PICTURES: 'profile-pictures',
  RECEIPTS: 'receipts',
} as const;

// Helper functions for common operations

/**
 * Get the current authenticated user
 */
export const getCurrentUser = async () => {
  const supabase = getSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error) {
    throw new Error(`Failed to get current user: ${error.message}`);
  }
  
  return user;
};

/**
 * Get the current user's profile
 */
export const getCurrentUserProfile = async () => {
  const supabase = getSupabaseClient();
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error('No authenticated user found');
  }
  
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  
  if (error) {
    throw new Error(`Failed to get user profile: ${error.message}`);
  }
  
  return profile;
};

/**
 * Subscribe to real-time changes for a table
 */
export const subscribeToTable = <T extends keyof Database['public']['Tables']>(
  table: T,
  callback: (payload: any) => void,
  filter?: string
) => {
  const supabase = getSupabaseClient();
  
  let subscription = supabase
    .channel(`${table}_changes`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: table,
        filter: filter,
      },
      callback
    );
  
  subscription.subscribe();
  
  return () => {
    subscription.unsubscribe();
  };
};

/**
 * Upload a file to Supabase Storage
 */
export const uploadFile = async (
  bucket: keyof typeof STORAGE_BUCKETS,
  filePath: string,
  file: File | Blob,
  options?: {
    cacheControl?: string;
    contentType?: string;
    upsert?: boolean;
  }
) => {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKETS[bucket])
    .upload(filePath, file, {
      cacheControl: options?.cacheControl || '3600',
      contentType: options?.contentType,
      upsert: options?.upsert || false,
    });
  
  if (error) {
    throw new Error(`Failed to upload file: ${error.message}`);
  }
  
  return data;
};

/**
 * Get a public URL for a file in storage
 */
export const getFileUrl = (bucket: keyof typeof STORAGE_BUCKETS, filePath: string): string => {
  const supabase = getSupabaseClient();
  
  const { data } = supabase.storage
    .from(STORAGE_BUCKETS[bucket])
    .getPublicUrl(filePath);
  
  return data.publicUrl;
};

/**
 * Delete a file from storage
 */
export const deleteFile = async (bucket: keyof typeof STORAGE_BUCKETS, filePath: string) => {
  const supabase = getSupabaseClient();
  
  const { error } = await supabase.storage
    .from(STORAGE_BUCKETS[bucket])
    .remove([filePath]);
  
  if (error) {
    throw new Error(`Failed to delete file: ${error.message}`);
  }
};

// Export the default client
export default getSupabaseClient;