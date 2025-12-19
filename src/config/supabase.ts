import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
// MUDANÇA: Usamos a Service Role Key se ela existir, senão tenta a Anon (fallback)
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Faltam variáveis de ambiente SUPABASE_URL ou SUPABASE_KEY');
}

// MUDANÇA: auth: { autoRefreshToken: false, persistSession: false }
// Isso é importante para backends, para não misturar sessões de usuários diferentes
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});