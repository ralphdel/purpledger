// setup_admin.mjs
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function provisionAdmin() {
  console.log('1. Provisioning Auth User: ralphdel14@yahoo.com...');
  const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
    email: 'ralphdel14@yahoo.com',
    password: 'admin1234',
    email_confirm: true,
    user_metadata: { business_name: 'admin', phone: 'default' },
    app_metadata: { is_super_admin: true }
  });

  if (authErr) {
    if (!authErr.message.toLowerCase().includes('already') && !authErr.message.toLowerCase().includes('registered')) {
      console.error('Failed to create user:', authErr.message);
      return;
    }
    console.log('User already registered. Proceeding to map test attributes...');
  }
  
  // Use existing user if they were already created 
  // (Note: Supabase doesn't easily expose the ID if it fails with 'already exists', so we fetch it)
  let userId = authData?.user?.id;
  if (!userId) {
    console.log('Fetching existing user...');
    const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
    const existing = usersData.users.find(u => u.email === 'ralphdel14@yahoo.com');
    userId = existing?.id;
    if (!userId) {
       console.error("Could not resolve User ID.");
       return;
    }
  }

  console.log('User ID resolved:', userId);

  // 2. We don't rely purely on the trigger right now just in case it hasn't fired or was missed. 
  // We will manually upsert the merchant record to ensure it is configured precisely for the dummy setup.
  console.log('2. Verifying Merchant Record for test mode...');
  let { data: merchantData } = await supabaseAdmin.from('merchants').select('id').eq('user_id', userId).single();
  let merchantErr = null;

  if (merchantData) {
    const { data: upd, error: ue } = await supabaseAdmin.from('merchants').update({
      is_test_mode: true,
      business_name: 'admin',
      merchant_tier: 'starter'
    }).eq('id', merchantData.id).select().single();
    merchantData = upd;
    merchantErr = ue;
  } else {
    const { data: ins, error: ie } = await supabaseAdmin.from('merchants').insert({
      user_id: userId,
      business_name: 'admin',
      email: 'ralphdel14@yahoo.com',
      phone: 'default',
      merchant_tier: 'starter',
      verification_status: 'unverified',
      is_test_mode: true
    }).select().single();
    merchantData = ins;
    merchantErr = ie;
  }

  if (merchantErr) {
    console.error('Failed to upsert merchant:', merchantErr);
    return;
  }

  // 3. Make sure the Owner role exists
  console.log('3. Resolving Owner Role...');
  let { data: roleData } = await supabaseAdmin.from('roles').select('id').eq('name', 'owner').single();
  if (!roleData) {
     console.error("Owner role not found in database!");
     return;
  }

  console.log('4. Mapping Team Member Record...');
  let { data: teamData } = await supabaseAdmin.from('merchant_team').select('id').eq('merchant_id', merchantData.id).eq('user_id', userId).single();
  let teamErr = null;

  if (!teamData) {
    const { error: te } = await supabaseAdmin.from('merchant_team').insert({
      merchant_id: merchantData.id,
      user_id: userId,
      role_id: roleData.id,
      is_active: true
    });
    teamErr = te;
  }

  if (teamErr) {
    console.error('Failed to map team:', teamErr);
    return;
  }

  console.log('✅ Configuration complete! You can now log in with ralphdel14@yahoo.com / admin1234');
}

provisionAdmin();
