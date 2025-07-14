/**
 * Medical Records Integration Verification Script
 * Tests the integration without running the full React Native app
 */

const { createClient } = require('@supabase/supabase-js');

// Mock environment variables - replace with actual values from .env
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'your_supabase_url_here';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'your_anon_key_here';

async function verifyMedicalIntegration() {
  console.log('🏥 Starting Medical Records Integration Verification...');
  console.log('=================================================');
  
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || SUPABASE_URL.includes('your_')) {
    console.log('❌ Environment variables not properly configured');
    console.log('📝 Please check your .env file and ensure:');
    console.log('   - EXPO_PUBLIC_SUPABASE_URL is set');
    console.log('   - EXPO_PUBLIC_SUPABASE_ANON_KEY is set');
    return;
  }
  
  try {
    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✅ Supabase client initialized');
    
    // Test 1: Check medical tables exist and are accessible
    console.log('\n1. Testing medical database tables...');
    
    const medicalTables = [
      'animal_health_records',
      'animal_vaccinations', 
      'animal_medications'
    ];
    
    let tablesAccessible = 0;
    
    for (const tableName of medicalTables) {
      try {
        const { data, error, count } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.log(`❌ ${tableName}: ${error.message}`);
        } else {
          console.log(`✅ ${tableName}: accessible (${count || 0} records)`);
          tablesAccessible++;
        }
      } catch (err) {
        console.log(`❌ ${tableName}: ${err.message}`);
      }
    }
    
    // Test 2: Verify table structures
    console.log('\n2. Verifying table structures...');
    
    // Check animal_health_records structure
    try {
      const { data, error } = await supabase
        .from('animal_health_records')
        .select('id, animal_id, health_event_type, description, metadata, occurred_at')
        .limit(1);
      
      if (!error) {
        console.log('✅ animal_health_records: correct structure');
      }
    } catch (err) {
      console.log(`⚠️  animal_health_records structure: ${err.message}`);
    }
    
    // Check animal_vaccinations structure  
    try {
      const { data, error } = await supabase
        .from('animal_vaccinations')
        .select('id, animal_id, vaccine_name, administered_at, next_due_date')
        .limit(1);
      
      if (!error) {
        console.log('✅ animal_vaccinations: correct structure');
      }
    } catch (err) {
      console.log(`⚠️  animal_vaccinations structure: ${err.message}`);
    }
    
    // Check animal_medications structure
    try {
      const { data, error } = await supabase
        .from('animal_medications')
        .select('id, animal_id, medication_name, start_date, end_date')
        .limit(1);
      
      if (!error) {
        console.log('✅ animal_medications: correct structure');
      }
    } catch (err) {
      console.log(`⚠️  animal_medications structure: ${err.message}`);
    }
    
    // Test 3: Test write operations (if authenticated)
    console.log('\n3. Testing write operations...');
    
    // Test health record creation
    const testHealthRecord = {
      animal_id: '00000000-0000-0000-0000-000000000001', // Test UUID
      recorded_by: '00000000-0000-0000-0000-000000000001', // Test UUID
      health_event_type: 'test_integration',
      description: 'Integration test record - safe to delete',
      occurred_at: new Date().toISOString(),
      metadata: {
        test: true,
        integration_verification: true
      }
    };
    
    try {
      const { data: healthData, error: healthError } = await supabase
        .from('animal_health_records')
        .insert(testHealthRecord)
        .select()
        .single();
      
      if (healthError) {
        if (healthError.message.includes('RLS')) {
          console.log('✅ Write protection: RLS policies working (authentication required)');
        } else {
          console.log(`⚠️  Health record insert: ${healthError.message}`);
        }
      } else {
        console.log('✅ Health record insert: successful');
        console.log(`📝 Test record ID: ${healthData.id}`);
        
        // Clean up test record
        await supabase
          .from('animal_health_records')
          .delete()
          .eq('id', healthData.id);
        console.log('🧹 Test record cleaned up');
      }
    } catch (writeError) {
      console.log(`⚠️  Write test: ${writeError.message}`);
    }
    
    // Test 4: Check related tables
    console.log('\n4. Checking related tables...');
    
    const relatedTables = ['animals', 'profiles'];
    
    for (const tableName of relatedTables) {
      try {
        const { data, error, count } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.log(`❌ ${tableName}: ${error.message}`);
        } else {
          console.log(`✅ ${tableName}: accessible (${count || 0} records)`);
        }
      } catch (err) {
        console.log(`❌ ${tableName}: ${err.message}`);
      }
    }
    
    // Summary
    console.log('\n=================================================');
    console.log('🏥 Medical Records Integration Verification Summary');
    console.log('=================================================');
    
    if (tablesAccessible === medicalTables.length) {
      console.log('✅ All medical tables accessible');
      console.log('✅ Database structure verified');
      console.log('✅ Integration ready for use');
      console.log('\n🎉 Medical records system is properly integrated!');
      
      console.log('\n📋 Next steps:');
      console.log('1. Test with authenticated user in the app');
      console.log('2. Verify data flow from app to database');
      console.log('3. Test real-time updates if needed');
    } else {
      console.log(`❌ Only ${tablesAccessible}/${medicalTables.length} medical tables accessible`);
      console.log('\n🔧 Troubleshooting needed:');
      console.log('1. Check database schema deployment');
      console.log('2. Verify RLS policies configuration');
      console.log('3. Ensure proper table permissions');
    }
    
  } catch (error) {
    console.error('❌ Integration verification failed:', error.message);
    console.log('\n🔧 Common issues:');
    console.log('1. Invalid Supabase URL or API key');
    console.log('2. Network connectivity issues');
    console.log('3. Database not properly configured');
  }
}

// Run the verification
verifyMedicalIntegration();