require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const venues = [
  { name: "Board room – 7th fl", capacity: 20, location: "7th Floor", is_active: true },
  { name: "Meeting room – 7th fl", capacity: 15, location: "7th Floor", is_active: true },
  { name: "6th fl activity area", capacity: 100, location: "6th Floor", is_active: true },
  { name: "Auditorium", capacity: 500, location: "Ground Floor", is_active: true },
  { name: "M101", capacity: 60, location: "M Block", is_active: true },
  { name: "M501", capacity: 60, location: "M Block", is_active: true },
  { name: "M413", capacity: 60, location: "M Block", is_active: true },
  { name: "B105", capacity: 60, location: "B Block", is_active: true },
  { name: "D305", capacity: 60, location: "D Block", is_active: true },
  { name: "A302", capacity: 60, location: "A Block", is_active: true },
  { name: "Y Block seminar hall", capacity: 120, location: "Y Block", is_active: true },
  { name: "VP seminar hall", capacity: 150, location: "VP Block", is_active: true },
  { name: "Any classroom/laboratory", capacity: 60, location: "Campus", is_active: true },
  { name: "VIT amphi theatre", capacity: 300, location: "Central", is_active: true },
  { name: "A block entrance amphi", capacity: 100, location: "A Block", is_active: true },
  { name: "VIT gate 1 - Plaza", capacity: 200, location: "Gate 1", is_active: true },
  { name: "VIT gate 2 amphi", capacity: 150, location: "Gate 2", is_active: true },
  { name: "VIT gate 2 – Plaza", capacity: 200, location: "Gate 2", is_active: true },
  { name: "M block entrance amphi", capacity: 150, location: "M Block", is_active: true },
  { name: "M block Atrium", capacity: 300, location: "M Block", is_active: true },
  { name: "VIT- Plaza", capacity: 500, location: "Central", is_active: true },
  { name: "Garden near pump room", capacity: 50, location: "Outdoor", is_active: true },
  { name: "VP office side area along the road", capacity: 100, location: "VP Block", is_active: true },
  { name: "Parking area", capacity: 1000, location: "Campus", is_active: true },
  { name: "X Block tree area", capacity: 50, location: "X Block", is_active: true },
  { name: "Play ground 1", capacity: 2000, location: "Sports Area", is_active: true },
  { name: "Play ground 2", capacity: 1500, location: "Sports Area", is_active: true },
  { name: "Garden area behind X block", capacity: 80, location: "X Block", is_active: true },
  { name: "Sports den", capacity: 40, location: "Sports Area", is_active: true },
  { name: "Sports den amphi", capacity: 100, location: "Sports Area", is_active: true },
  { name: "VP lawns", capacity: 400, location: "VP Block", is_active: true },
  { name: "VP Courtyard", capacity: 200, location: "VP Block", is_active: true }
];

async function seed() {
  console.log("Seeding venues...");
  const { data, error } = await supabase.from('venues').insert(venues);
  if (error) {
    console.error("Error seeding venues:", error);
  } else {
    console.log("Venues seeded successfully!");
  }
}

seed();
