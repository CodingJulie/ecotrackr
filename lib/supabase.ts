import { createBrowserClient } from '@supabase/ssr';
import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/supabase-env';

export const supabase = createBrowserClient(getSupabaseUrl(), getSupabaseAnonKey());