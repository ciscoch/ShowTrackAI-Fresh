/**
 * Debug script to test journal creation
 * Add this to your app console to debug journal creation
 */

import { ServiceFactory } from '../src/core/services/adapters/ServiceFactory';
import { getSupabaseClient, getCurrentUser } from '../backend/api/clients/supabase';

export const debugJournalCreation = async () => {
  console.log('🔍 Debug: Journal Creation Process');
  console.log('==================================');
  
  try {
    // 1. Check if using Supabase backend
    const isBackend = ServiceFactory.isBackendAvailable();
    console.log('✅ Using backend:', isBackend);
    
    // 2. Check Supabase client
    const supabase = getSupabaseClient();
    console.log('✅ Supabase client initialized');
    
    // 3. Check current user
    const user = await getCurrentUser();
    console.log('👤 Current user:', user ? user.id : 'NOT AUTHENTICATED');
    
    if (!user) {
      console.error('❌ No authenticated user - this is the problem!');
      return;
    }
    
    // 4. Test journal service
    const journalService = ServiceFactory.getJournalService();
    console.log('📝 Journal service type:', journalService.constructor.name);
    
    // 5. Test creating a simple journal entry
    const testEntry = {
      title: 'Debug Test Journal',
      description: 'Testing journal creation',
      date: new Date(),
      duration: 15,
      category: 'Other' as any,
      feedData: { feeds: [] },
      aetSkills: [],
      userId: user.id,
    };
    
    console.log('📤 Attempting to create journal entry...');
    const result = await journalService.createJournalEntry(testEntry);
    console.log('✅ Journal created successfully:', result);
    
  } catch (error) {
    console.error('❌ Error in journal creation:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
  }
};

// Run the debug
debugJournalCreation();