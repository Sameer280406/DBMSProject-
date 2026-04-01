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
        const { type, student_id, ...formData } = req.body;
        
        if (type === 'venue_booking') {
            const { data: checkApp } = await supabase
                .from('applications')
                .select('status')
                .eq('event_proposal_id', formData.event_proposal_id)
                .eq('type', 'event_proposal')
                .single();
                
            if (!checkApp || checkApp.status !== 'approved') {
                return res.status(400).json({ error: 'Event Proposal must be fully approved before booking a venue.' });
            }
        }

        const { data: desk1 } = await supabase.from('desks').select('id').eq('order_index', 1).single();
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

        if (type === 'event_proposal') {
            await supabase.from('event_proposals').insert({ application_id: newApp.id, ...formData });
        } else if (type === 'venue_booking') {
            await supabase.from('venue_bookings').insert({ application_id: newApp.id, ...formData });
        } else if (type === 'permission_letter') {
            await supabase.from('permission_letters').insert({ application_id: newApp.id, ...formData });
        }

        sendEmail({
            to: formData.email || 'student@vcamps.edu.in',
            subject: 'vCAMPs Application Submitted',
            text: `Your ${type.replace('_', ' ')} application has been successfully submitted and forwarded to Desk 1.`
        });

        res.json({ success: true, applicationId: newApp.id });

    } catch (err) {
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
            const { data: nextDesk } = await supabase
                .from('desks')
                .select('id, name')
                .eq('order_index', currentDesk.order_index + 1)
                .single();

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`vCAMPs Node Backend is listening on port ${PORT}`);
});
