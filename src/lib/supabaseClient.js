import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gilqwzshywmulcoziqcu.supabase.co';
const supabaseAnonKey = 'sb_publishable_5aQoK2LTkMtre5LfcEu00w_rSebz5Cb';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);