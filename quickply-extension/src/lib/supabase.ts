import { createClient } from '@supabase/supabase-js';

// Get environment variables
// For ES modules (popup/options): Vite replaces import.meta.env at build time
// For IIFE (background/content): esbuild replaces import.meta.env.VITE_* with actual values
// @ts-ignore - import.meta may not be available in IIFE context, but esbuild will replace it
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
// @ts-ignore
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export interface Profile {
  id: string;
  user_id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  resume_url?: string;
  cover_letter_url?: string;
  created_at?: string;
  updated_at?: string;
}

