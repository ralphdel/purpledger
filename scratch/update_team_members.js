require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  console.log('Fetching team members...');
  
  // Update all team members who were invited by someone (i.e. not the owner who created the account)
  // Or simply update all team members who don't have the 'owner' role.
  // We can just query all team members.
  const { data, error } = await supabase
    .from('merchant_team')
    .select('*, roles(name)')
    
  if (error) {
    console.error('Error fetching team members:', error);
    return;
  }
  
  console.log(`Found ${data.length} team members total.`);
  let updatedCount = 0;
  
  for (const member of data) {
    // Check if they are an owner. Owner usually has role 'owner' or a role name 'Owner'
    // In some tables, role is a string. In others, role_id points to roles table.
    // We'll skip if role_id points to 'Owner' or role === 'owner', or if invited_by is null.
    // It's safer to skip if invited_by is null, since owners are not invited.
    if (!member.invited_by) {
      console.log(`Skipping member ${member.user_id} (likely owner, no invited_by)`);
      continue;
    }
    
    // Update them to force registration
    console.log(`Updating member ${member.user_id}...`);
    const { error: updateError } = await supabase
      .from('merchant_team')
      .update({
        must_change_password: true,
        is_active: false
      })
      .eq('id', member.id);
      
    if (updateError) {
      console.error(`Failed to update member ${member.id}:`, updateError);
    } else {
      updatedCount++;
    }
  }
  
  console.log(`Successfully updated ${updatedCount} existing team members to require registration completion.`);
}

main();
