import { createClient } from '@supabase/supabase-js';
import type { Database } from '../src/types/database.types';

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios');
}

const supabaseAdmin = createClient<Database>(supabaseUrl, serviceRoleKey);

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.error('Uso: tsx scripts/create-admin.ts <email> <senha>');
  process.exit(1);
}

const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
});

if (authError) throw new Error(`Auth error: ${authError.message}`);

if (!authData.user) throw new Error('Usuário não criado pelo Supabase');
const userId = authData.user.id;

const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
  id: userId,
  email,
  role: 'admin',
});

if (profileError) throw new Error(`Profile error: ${profileError.message}`);

console.log(`Admin criado com sucesso: ${email} (id: ${userId})`);
