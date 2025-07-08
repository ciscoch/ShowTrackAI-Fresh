/**
 * Hook to check if Supabase backend is enabled
 */

import { config } from '../config/environment';

export const useSupabaseBackend = () => {
  return {
    isEnabled: config.useBackend,
    supabaseUrl: config.supabase.url,
    hasCredentials: !!(config.supabase.url && config.supabase.anonKey),
  };
};