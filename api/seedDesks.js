require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://ggeakqkmbdqznbljkwjv.supabase.co';
// Warning: This requires the SERVICE_ROLE_KEY to bypass RLS and create accounts directly!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdnZWFrcWttYmRxem5ibGprd2p2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDk3NDgyMywiZXhwIjoyMDkwNTUwODIzfQ.PSmJsfUInBz1Pg6U1rbt7LnOq3QkGYTdz-v2yQOyYEU';

const supabase = createClient(supabaseUrl, supabaseKey);

const DEFAULT_PASSWORD = 'Password@123';

const officialDesks = [
    { email: 'hod.admin@vit.edu.in', name: 'HOD', desk_name: 'Head of Department', order_index: 1 },
    { email: 'security.admin@vit.edu.in', name: 'Security Chief', desk_name: 'Security', order_index: 2 },
    { email: 'principal.admin@vit.edu.in', name: 'Principal', desk_name: 'Principal', order_index: 3 }
];

async function seedPipeline() {
    console.log("🚀 Starting vCAMPs Authority Seeder...");

    try {
        console.log("🧹 1. Wiping broken or legacy internal desks...");
        const { error: deleteErr } = await supabase.from('desks').delete().neq('order_index', -1);
        if (deleteErr) console.warn("Notice during delete:", deleteErr.message);

        for (const desk of officialDesks) {
            console.log(`\n⚙️ 2. Provisioning Authority: ${desk.name} (${desk.desk_name})`);
            
            // Check if user already exists
            const { data: existingUser } = await supabase.auth.admin.listUsers();
            let authId;
            const existing = existingUser?.users?.find(u => u.email === desk.email);

            if (existing) {
                console.log(`   - Found existing auth user: ${existing.id}`);
                authId = existing.id;
            } else {
                console.log(`   - Creating explicit auth.users bypass account...`);
                const { data: created, error: createErr } = await supabase.auth.admin.createUser({
                    email: desk.email,
                    password: DEFAULT_PASSWORD,
                    email_confirm: true
                });
                if (createErr) throw createErr;
                authId = created.user.id;
                console.log(`   - Successfully created auth user: ${authId}`);
            }

            // Upsert Profile
            console.log(`   - Mapping to public.profiles as 'admin'...`);
            const { error: profileErr } = await supabase.from('profiles').upsert({
                id: authId,
                name: desk.name,
                email: desk.email,
                role: 'admin'
            }, { onConflict: 'id' });
            if (profileErr) throw profileErr;

            // Generate Desk Route
            console.log(`   - Registering strict Pipeline Route: Desk ${desk.order_index}...`);
            const { error: deskErr } = await supabase.from('desks').insert({
                name: desk.desk_name,
                order_index: desk.order_index,
                admin_user_id: authId
            });
            if (deskErr) throw deskErr;
            
            console.log(`   ✅ Desk ${desk.order_index} Successfully Seeded!`);
        }

        console.log("\n🎉 SEEDING COMPLETE! The strict 3-Desk Pipeline architecture is now perfectly initialized.");

    } catch (error) {
        console.error("\n❌ SEEDING FAILED:", error);
    }
}

seedPipeline();
