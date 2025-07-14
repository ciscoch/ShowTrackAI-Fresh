// =========================================================================
// FFA Database Setup Utility
// =========================================================================
// Quick setup utility to check and create FFA tables if needed
// =========================================================================

import { ServiceFactory } from '../core/services/adapters/ServiceFactory';

export const checkFFATablesExist = async (): Promise<boolean> => {
  try {
    const adapter = ServiceFactory.getSupabaseAdapter();
    if (!adapter) {
      console.log('📱 No Supabase adapter - using local storage mode');
      return true; // Local storage mode doesn't need tables
    }

    // Try to query one of our FFA tables to see if it exists
    await adapter.query('ffa_degree_progress', { limit: 1 });
    console.log('✅ FFA tables exist');
    return true;
  } catch (error) {
    console.log('❌ FFA tables do not exist:', error.message);
    return false;
  }
};

export const createBasicFFAData = async (userId: string): Promise<void> => {
  try {
    const adapter = ServiceFactory.getSupabaseAdapter();
    if (!adapter) {
      console.log('📱 Local storage mode - no database setup needed');
      return;
    }

    console.log('🔧 Setting up basic FFA data for user:', userId);

    // Check if we can create some basic data
    try {
      // Try to create a sample degree progress record
      await adapter.create('ffa_degree_progress', {
        user_id: userId,
        degree_level: 'discovery',
        status: 'in_progress',
        requirements_met: {},
        completion_percentage: 0,
        advisor_approved: false
      });
      console.log('✅ Successfully created basic FFA degree progress record');
    } catch (createError) {
      console.log(`
🚫 Could not create FFA data - tables likely don't exist yet.

📋 SETUP REQUIRED: Run these SQL scripts in your Supabase dashboard:

1. Navigate to https://app.supabase.com
2. Open your project → SQL Editor
3. Copy and run: /commands/FFA-Supabase-Integration-Scripts.sql

This will create all necessary FFA tables, indexes, and security policies.

📖 Full setup guide: /setup-ffa-database.md

Error details: ${createError.message}
      `);
    }

  } catch (error) {
    console.error('❌ Error setting up FFA data:', error);
  }
};