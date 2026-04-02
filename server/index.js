require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const { initCronJobs } = require('./services/cron');
const { sendEmail } = require('./services/email');

const app = express();
app.use(cors());
app.use(express.json());

const supabaseUrl = process.env.SUPABASE_URL || 'https://ggeakqkmbdqznbljkwjv.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdnZWFrcWttYmRxem5ibGprd2p2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDk3NDgyMywiZXhwIjoyMDkwNTUwODIzfQ.PSmJsfUInBz1Pg6U1rbt7LnOq3QkGYTdz-v2yQOyYEU';
const supabase = createClient(supabaseUrl, supabaseKey);

// SLA Expiry Checks running in background
initCronJobs(supabase);

app.post('/api/signup', async (req, res) => {
    try {
        const { email, password, name, role, roll_no, committee_name, desk_name, desk_order, year_of_study, branch, convenor_phone, convenor_email, designation } = req.body;

        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true
        });

        if (authError) throw authError;

        const userId = authData.user.id;

        const { error: profileError } = await supabase
            .from('profiles')
            .insert({ id: userId, name, email, role });
            
        if (profileError) throw profileError;

        if (role === 'student') {
            await supabase.from('students').insert({
                user_id: userId,
                roll_no: roll_no || `ROLL-${Math.floor(Math.random() * 1000)}`,
                committee_name: committee_name || 'General Body',
                year_of_study: year_of_study || 'FY',
                branch: branch || '',
                convenor_phone: convenor_phone || '',
                convenor_email: convenor_email || '',
                designation: designation || 'Student'
            });
        } else if (role === 'admin') {
            await supabase.from('desks').insert({
                name: desk_name || 'New Registration Desk',
                order_index: parseInt(desk_order) || 99,
                admin_user_id: userId
            });
        }

        res.json({ success: true });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/update-profile', async (req, res) => {
    try {
        const { user_id, role, name, year_of_study, branch, committee_name, convenor_phone, convenor_email, designation, desk_name } = req.body;
        
        if (!user_id) return res.status(400).json({ error: "Missing user_id" });

        // Update profiles for name
        if (name) {
            const { error: profileErr } = await supabase
                .from('profiles')
                .update({ name })
                .eq('id', user_id);
            if (profileErr) throw profileErr;
        }

        if (role === 'admin') {
            // Update admin desks table attributes
            if (desk_name) {
                const { error: deskErr } = await supabase
                    .from('desks')
                    .update({ name: desk_name })
                    .eq('admin_user_id', user_id);
                if (deskErr) throw deskErr;
            }
        } else {
            // Update students table attributes
            const { error: studentErr } = await supabase
                .from('students')
                .update({ 
                    year_of_study, 
                    branch, 
                    committee_name, 
                    convenor_phone, 
                    convenor_email,
                    designation
                })
                .eq('user_id', user_id);
                
            if (studentErr) throw studentErr;
        }

        res.json({ success: true });
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/submit', async (req, res) => {
    try {
        const { type, student_id, ...rawFormData } = req.body;
        
        // Scrub empty strings to null to prevent postgres cast errors (like "" to Decimal)
        const allFormData = Object.fromEntries(
            Object.entries(rawFormData).map(([k, v]) => [k, v === '' ? null : v])
        );

        // Pull out student email for notifications, keep the rest for the doc tables
        const { email, ...formData } = allFormData;
        
        if (type === 'venue_booking') {
            console.log("Checking approval for proposal:", formData.event_proposal_id);
            const { data: checkData, error: checkErr } = await supabase
                .from('event_proposals')
                .select('applications!event_proposals_application_id_fkey(status)')
                .eq('id', formData.event_proposal_id)
                .single();
            
            console.log("Check Result:", checkData, "Error:", checkErr);
            
            if (checkErr || !checkData || checkData.applications?.status !== 'approved') {
                return res.status(400).json({ error: 'Event Proposal must be fully approved before booking a venue.' });
            }
        }

        const { data: desksArray } = await supabase.from('desks').select('id').eq('order_index', 1).limit(1);
        const desk1 = desksArray?.[0];
        if (!desk1) throw new Error('System error: Desk 1 is not configured in the database.');

        const { data: newApp, error: appError } = await supabase
            .from('applications')
            .insert({
                type,
                student_id,
                status: 'pending',
                current_desk_id: desk1.id,
                submitted_at: new Date().toISOString()
            }).select().single();

        if (appError) throw appError;

        let secondaryError = null;
        let childId = null;
        if (type === 'event_proposal') {
            const { data, error } = await supabase.from('event_proposals').insert({ application_id: newApp.id, ...formData }).select().single();
            secondaryError = error;
            childId = data?.id;
        } else if (type === 'venue_booking') {
            const { data, error } = await supabase.from('venue_bookings').insert({ application_id: newApp.id, ...formData }).select().single();
            secondaryError = error;
            childId = data?.id;
        } else if (type === 'permission_letter') {
            const { data, error } = await supabase.from('permission_letters').insert({ application_id: newApp.id, ...formData }).select().single();
            secondaryError = error;
            childId = data?.id;
        }

        if (secondaryError) {
            await supabase.from('applications').delete().eq('id', newApp.id);
            throw secondaryError;
        }

        // 🔗 CRITICAL FIX: Link the child ID back to the master application row
        const updateField = type === 'event_proposal' ? 'event_proposal_id' : (type === 'venue_booking' ? 'venue_booking_id' : 'permission_letter_id');
        await supabase.from('applications').update({ [updateField]: childId }).eq('id', newApp.id);

        sendEmail({
            to: formData.email || 'student@vcamps.edu.in',
            subject: 'vCAMPs Application Submitted',
            text: `Your ${type.replace('_', ' ')} application has been successfully submitted and forwarded to Desk 1.`
        });

        res.json({ success: true, applicationId: newApp.id });

    } catch (err) {
        console.error("Submit Error:", err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/desk-action', async (req, res) => {
    try {
        const { application_id, action, remark, digital_signature, admin_user_id } = req.body;
        
        const { data: appData } = await supabase
            .from('applications')
            .select('current_desk_id, student_id')
            .eq('id', application_id)
            .single();

        if (!appData) return res.status(404).json({ error: 'Application not found.' });

        const { data: currentDesk } = await supabase
            .from('desks')
            .select('order_index, name')
            .eq('id', appData.current_desk_id)
            .single();

        const acted_at = new Date();
        
        await supabase.from('approval_log').insert({
            application_id,
            desk_id: appData.current_desk_id,
            admin_user_id,
            action,
            remark,
            digital_signature, 
            acted_at: acted_at.toISOString()
        });

        // Notify Student
        const { data: student } = await supabase.from('students').select('user_id').eq('id', appData.student_id).single();
        let studentEmail = 'student@vcamps.edu.in';
        if (student) {
            const { data: profile } = await supabase.from('profiles').select('email').eq('id', student.user_id).single();
            if (profile) studentEmail = profile.email;
        }

        if (action === 'approved') {
            const { data: nextDesksArray } = await supabase
                .from('desks')
                .select('id, name')
                .eq('order_index', currentDesk.order_index + 1)
                .limit(1);
            const nextDesk = nextDesksArray?.[0];

            if (nextDesk) {
                await supabase.from('applications')
                    .update({ 
                        current_desk_id: nextDesk.id, 
                        status: 'under_review',
                        updated_at: acted_at.toISOString()
                    }).eq('id', application_id);

                sendEmail({
                    to: studentEmail,
                    subject: `vCAMPs Update: Desk ${currentDesk.order_index} Approved`,
                    text: `Your application (ID: ${application_id}) was approved by ${currentDesk.name} and forwarded to ${nextDesk.name}.`
                });

            } else {
                await supabase.from('applications')
                    .update({ 
                        current_desk_id: null, 
                        status: 'approved',
                        updated_at: acted_at.toISOString()
                    }).eq('id', application_id);
                
                sendEmail({
                    to: studentEmail,
                    subject: `vCAMPs Success: Application Fully Approved!`,
                    text: `Great news! Your application (ID: ${application_id}) has received all necessary signatures and is Fully Approved.`
                });
            }
        } else if (action === 'rejected') {
            await supabase.from('applications')
                .update({ 
                    current_desk_id: null, 
                    status: 'rejected',
                    updated_at: acted_at.toISOString()
                }).eq('id', application_id);
            
            sendEmail({
                to: studentEmail,
                subject: `vCAMPs Update: Application Rejected`,
                text: `Your application was rejected by ${currentDesk.name}. Remark: "${remark}"`
            });
        } else if (action === 'returned') {
            await supabase.from('applications')
                .update({ 
                    current_desk_id: null, 
                    status: 'returned',
                    updated_at: acted_at.toISOString()
                }).eq('id', application_id);
                
            sendEmail({
                to: studentEmail,
                subject: `vCAMPs Update: Application Returned for Revision`,
                text: `Your application was returned by ${currentDesk.name}. Feedback: "${remark}" \nPlease login and resubmit.`
            });
        }
        
        res.json({ success: true, action });

    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

// Resubmit Endpoint for students
app.post('/api/update-application', async (req, res) => {
    try {
        const { application_id, type, ...rawFormData } = req.body;
        const allFormData = Object.fromEntries(
            Object.entries(rawFormData).map(([k, v]) => [k, v === '' ? null : v])
        );

        // Pull out email if present (though usually not used here), keep rest for doc table
        const { email, ...formData } = allFormData;

        // 1. Get Desk 1 ID to restart pipeline
        const { data: desks } = await supabase.from('desks').select('id').eq('order_index', 1).limit(1);
        if (!desks?.[0]) throw new Error('Desk 1 configuration missing.');

        // 2. Update Application Status
        const { error: appErr } = await supabase
            .from('applications')
            .update({
                status: 'pending',
                current_desk_id: desks[0].id,
                updated_at: new Date().toISOString()
            })
            .eq('id', application_id);
        
        if (appErr) throw appErr;

        // 3. Update the specific document table
        let table = '';
        if (type === 'event_proposal') table = 'event_proposals';
        else if (type === 'venue_booking') table = 'venue_bookings';
        else if (type === 'permission_letter') table = 'permission_letters';

        if (table) {
            const { error: childErr } = await supabase
                .from(table)
                .update(formData)
                .eq('application_id', application_id);
            if (childErr) throw childErr;
        }

        res.json({ success: true });
    } catch(err) {
        console.error("Update Error:", err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/delete-application', async (req, res) => {
    try {
        const { id, student_id } = req.body;
        
        // 1. Check if application belongs to the student and is in a deletable state
        const { data: app, error: fetchErr } = await supabase
            .from('applications')
            .select('status, student_id')
            .eq('id', id)
            .single();
            
        if (fetchErr || !app) throw new Error('Application not found.');
        if (app.student_id !== student_id) throw new Error('Unauthorized deletion request.');
        
        // Only allow deleting Pending or Returned applications
        if (!['pending', 'returned'].includes(app.status)) {
            throw new Error(`Cannot delete application in status: ${app.status}. Please contact office if needed.`);
        }

        // 2. Perform Cascading Delete (Manually to be safe)
        // Child tables
        await supabase.from('event_proposals').delete().eq('application_id', id);
        await supabase.from('venue_bookings').delete().eq('application_id', id);
        await supabase.from('permission_letters').delete().eq('application_id', id);
        await supabase.from('approval_log').delete().eq('application_id', id);
        await supabase.from('signatures').delete().eq('application_id', id);
        
        // Final Master Table
        const { error: finalErr } = await supabase.from('applications').delete().eq('id', id);
        if (finalErr) throw finalErr;

        res.json({ success: true });
    } catch (err) {
        console.error("Delete Error:", err);
        res.status(403).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 3000;

app.get('/api/admin/all-users', async (req, res) => {
    try {
        const { data: profiles, error: pErr } = await supabase.from('profiles').select('*');
        const { data: students, error: sErr } = await supabase.from('students').select('*');
        const { data: desks, error: dErr } = await supabase.from('desks').select('*');
        
        if (pErr || sErr || dErr) throw new Error("Could not fetch unified user list.");

        const combinedUsers = profiles.map(p => {
            const studentData = students.find(s => s.user_id === p.id);
            const deskData = desks.find(d => d.admin_user_id === p.id);
            return {
                ...p,
                studentDetails: studentData || null,
                deskDetails: deskData || null
            };
        });

        res.json({ success: true, users: combinedUsers });
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/admin/purge-user', async (req, res) => {
    try {
        const { user_id } = req.body;
        if (!user_id) throw new Error("Missing user_id for purge.");

        // 1. Get user role to know if we need to clean student/desk tables
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user_id).single();
        if (!profile) throw new Error("User profile not found.");

        // 2. Cascade delete applications and their content
        const { data: apps } = await supabase.from('applications').select('id').eq('student_id', user_id);
        if (apps && apps.length > 0) {
            for (const app of apps) {
                await supabase.from('event_proposals').delete().eq('application_id', app.id);
                await supabase.from('venue_bookings').delete().eq('application_id', app.id);
                await supabase.from('permission_letters').delete().eq('application_id', app.id);
                await supabase.from('approval_log').delete().eq('application_id', app.id);
            }
            await supabase.from('applications').delete().eq('student_id', user_id);
        }

        // 3. Clean role-specific tables
        if (profile.role === 'student') {
            await supabase.from('students').delete().eq('user_id', user_id);
        } else if (profile.role === 'admin') {
            await supabase.from('desks').delete().eq('admin_user_id', user_id);
        }

        // 4. Delete profile and auth user
        await supabase.from('profiles').delete().eq('id', user_id);
        await supabase.auth.admin.deleteUser(user_id);

        res.json({ success: true });
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`vCAMPs Node Backend is listening on port ${PORT}`);
});
