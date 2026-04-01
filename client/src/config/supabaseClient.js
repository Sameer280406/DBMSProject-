import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || "https://ggeakqkmbdqznbljkwjv.supabase.co",
  import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_s5nyF7BIavPIaD7NwwAcnA_EvkVOdQL"
)
