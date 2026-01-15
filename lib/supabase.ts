import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create Supabase client with enhanced auth configuration for better mobile support
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Enable session persistence across browser restarts
    persistSession: true,

    // Auto-refresh tokens before expiry
    autoRefreshToken: true,

    // Detect sessions from URL (for email confirmations, magic links)
    detectSessionInUrl: true,

    // Use localStorage for better persistence (fallback to sessionStorage)
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,

    // Storage key for session data
    storageKey: 'supabase.auth.token',

    // Flow type for better mobile compatibility
    flowType: 'pkce', // More secure and mobile-friendly
  },

  // Global configuration
  global: {
    headers: {
      'X-Client-Info': 'morren-marketplace-app',
    },
  },

  // Database configuration
  db: {
    schema: 'public',
  },

  // Realtime configuration (optional, for future use)
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Add connection error recovery
if (typeof window !== 'undefined') {
  // Handle network errors gracefully
  window.addEventListener('online', () => {
    console.log('Network connection restored, refreshing session...');
    supabase.auth.refreshSession().catch(err => {
      console.error('Failed to refresh session after reconnection:', err);
    });
  });

  // Log session state for debugging
  supabase.auth.onAuthStateChange((event, session) => {
    console.log('Auth state changed:', event, session ? 'Session active' : 'No session');

    // Store last successful session timestamp
    if (session) {
      localStorage.setItem('last_session_check', new Date().toISOString());
    }
  });
}
