import React from 'react';
import AppWithAuth from './src/AppWithAuth';

export default function App() {
  // Use the new authentication flow with real Supabase credentials
  return <AppWithAuth />;
  
  // Use test mode to see user management features with comprehensive testing
  // return <AppWithAuth testMode={true} />;
}