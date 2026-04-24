require("dotenv").config({ path: ".env.local" });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function deleteLingeringUsers() {
  const { data: users, error } = await supabase.auth.admin.listUsers();
  if (error) { console.error("Error fetching users:", error); return; }
  
  const lingering = users.users.filter(u => u.email === 'ralphynose@gmail.com' || u.email === 'odamilola62@gmail.com');
  console.log(`Found ${lingering.length} lingering users.`);
  
  for (const user of lingering) {
    const { error: delError } = await supabase.auth.admin.deleteUser(user.id);
    if (delError) {
      console.error(`Error deleting ${user.email}:`, delError);
    } else {
      console.log(`Successfully deleted ${user.email}`);
    }
  }
}

deleteLingeringUsers();
