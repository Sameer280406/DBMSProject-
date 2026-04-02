require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing environment variables SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createITUser(email, password, name) {
  try {
    console.log(`Creating IT Admin: ${email}...`);
    
    // 1. Create User in Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (authError) throw authError;

    const userId = authData.user.id;

    // 2. Create Profile with role 'it_support'
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        name,
        email,
        role: 'it_support'
      });

    if (profileError) throw profileError;

    console.log("Success! IT Administrator created.");
    console.log(`Email: ${email}`);
    process.exit(0);

  } catch (err) {
    console.error("Critical Error:", err.message);
    process.exit(1);
  }
}

// ARGS: email, password, name
const [,, email, password, name] = process.argv;

if (!email || !password || !name) {
  console.log("Usage: node create_it_account.js <email> <password> <name>");
} else {
  createITUser(email, password, name);
}
