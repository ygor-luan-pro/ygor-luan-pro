import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

export const supabase = createClient<Database>(
  import.meta.env.PUBLIC_SUPABASE_URL,
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
  { auth: { persistSession: false } },
);

export const supabaseAdmin = createClient<Database>(
  import.meta.env.PUBLIC_SUPABASE_URL,
  import.meta.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);
