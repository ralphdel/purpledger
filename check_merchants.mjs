import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const { data: users } = await supabaseAdmin.auth.admin.listUsers();
  console.log("Users:", users.users.map(u => ({ email: u.email, id: u.id, is_super_admin: u.app_metadata?.is_super_admin })));

  const { data: merchants } = await supabaseAdmin.from('merchants').select('id, user_id, business_name, email');
  console.log("Merchants:", merchants);
}

check();
