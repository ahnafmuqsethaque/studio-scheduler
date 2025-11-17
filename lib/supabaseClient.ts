import { createSupabaseBrowserClient } from './supabase/client.ts';
import type { SupabaseClient } from '@supabase/supabase-js';

export const supabase: SupabaseClient = createSupabaseBrowserClient();
