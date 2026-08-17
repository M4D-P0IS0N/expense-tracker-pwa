import { createClient } from '@supabase/supabase-js';

const getEnvVar = (name) => {
    try {
        if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[name]) {
            return import.meta.env[name];
        }
    } catch {}
    try {
        if (typeof process !== 'undefined' && process.env && process.env[name]) {
            return process.env[name];
        }
    } catch {}
    return '';
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL') || 'https://placeholder.supabase.co';
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY') || 'placeholder-anon-key';

if (supabaseUrl === 'https://placeholder.supabase.co' && typeof window !== 'undefined') {
    console.warn("Supabase URL or Anon Key is missing. Please check your .env file.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
