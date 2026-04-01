import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey || supabaseAnonKey === 'sb_publishable_s5nyF7BIavPIaD7NwwAcnA_EvkVOdQL') {
  throw new Error('Supabase env variables VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set.\nSet them in client/.env from your Supabase project settings.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

