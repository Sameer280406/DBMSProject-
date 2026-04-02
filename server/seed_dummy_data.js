require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function seedDummyApps() {
  console.log("Seeding dummy applications...");
  
  // 1. Get a valid student ID (id column in students table)
  const { data: studentRecords } = await supabase.from('students').select('id').limit(1);
  const { data: desks } = await supabase.from('desks').select('id, name').order('order_index');

  if (!studentRecords || studentRecords.length === 0 || !desks || desks.length === 0) {
    console.error("Could not find valid student record or desks for seeding.");
    return;
  }

  const studentId = studentRecords[0].id;
  const hodDeskId = desks.find(d => d.name === 'Head of Department')?.id || desks[0].id;
  const securityDeskId = desks.find(d => d.name === 'Security')?.id || desks[1]?.id || desks[0].id;

  const dummyApps = [
    {
      student_id: studentId,
      type: 'event_proposal',
      status: 'pending',
      current_desk_id: hodDeskId,
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      student_id: studentId,
      type: 'venue_booking',
      status: 'pending',
      current_desk_id: hodDeskId,
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      student_id: studentId,
      type: 'permission_letter',
      status: 'returned',
      current_desk_id: hodDeskId,
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      student_id: studentId,
      type: 'event_proposal',
      status: 'under_review',
      current_desk_id: securityDeskId,
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  const { data: apps, error: appError } = await supabase.from('applications').insert(dummyApps).select();
  
  if (appError) {
    console.error("Error seeding apps:", appError);
    return;
  }

  console.log(`Seeded ${apps.length} applications.`);

  for (const app of apps) {
    if (app.type === 'event_proposal') {
      await supabase.from('event_proposals').insert({
        application_id: app.id,
        event_name: "Technovation 2026",
        objective: "Showcasing student projects",
        participants_count: 500,
        proposed_date: "2026-05-15"
      });
    } else if (app.type === 'permission_letter') {
      await supabase.from('permission_letters').insert({
        application_id: app.id,
        details: "Industrial Visit to Tata Motors"
      });
    }
    // Venue booking detail seeding is skipped for now due to complexity of nested event_proposals
  }
  
  console.log("Seeding complete!");
}

seedDummyApps();
