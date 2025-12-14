import { createClient } from '@supabase/supabase-js';

// Access environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase URL or Anon Key is missing. Authentication will fail.');
}

// Create the Supabase client
// Note: If running locally, you might want to switch VITE_SUPABASE_URL to your local instance (e.g., http://localhost:54321)
export const supabase = createClient(
    supabaseUrl || '',
    supabaseAnonKey || ''
);
