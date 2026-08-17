import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env ? import.meta.env.VITE_SUPABASE_URL : (typeof process !== 'undefined' ? process.env?.VITE_SUPABASE_URL : '');
const supabaseAnonKey = import.meta.env ? import.meta.env.VITE_SUPABASE_ANON_KEY : (typeof process !== 'undefined' ? process.env?.VITE_SUPABASE_ANON_KEY : '');

if ((!supabaseUrl || !supabaseAnonKey) && typeof window !== 'undefined') {
    console.error("Supabase URL or Anon Key is missing. Please check your .env file.");
}

export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder-anon-key');
