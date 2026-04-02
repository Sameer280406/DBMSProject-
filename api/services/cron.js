const cron = require('node-cron');
const { sendEmail } = require('./email');

const initCronJobs = (supabase) => {
    // Run every hour to check for 4-day SLA expiry
    cron.schedule('0 * * * *', async () => {
        console.log('[CRON] Checking 4-day SLA timeouts...');
        
        // Find applications where 4 days have passed since updated_at
        const boundaryDate = new Date();
        boundaryDate.setDate(boundaryDate.getDate() - 4);
        
        const { data: expiredApps, error: appError } = await supabase
            .from('applications')
            .select('id, current_desk_id, student_id, updated_at')
            .eq('status', 'under_review')
            .lt('updated_at', boundaryDate.toISOString());

        if (appError) return console.error('[CRON] Error finding apps:', appError);

        if (expiredApps && expiredApps.length > 0) {
            for (let app of expiredApps) {
                // Expire the application
                await supabase
                    .from('applications')
                    .update({ status: 'expired' })
                    .eq('id', app.id);

                // Insert into negligence_flags
                await supabase
                    .from('negligence_flags')
                    .insert({
                        desk_id: app.current_desk_id,
                        application_id: app.id,
                        notes: `Auto-expired due to 4-day SLA breach. Missing action since ${app.updated_at}`
                    });

                // Fetch student ID to notify
                const { data: studentData } = await supabase
                    .from('students')
                    .select('user_id')
                    .eq('id', app.student_id)
                    .single();
                    
                if (studentData) {
                    const { data: profileData } = await supabase
                        .from('profiles')
                        .select('email')
                        .eq('id', studentData.user_id)
                        .single();
                        
                    if (profileData) {
                        sendEmail({
                            to: profileData.email,
                            subject: `vCAMPs Alert: Application Expired`,
                            text: `Your application (ID: ${app.id}) has been automatically marked as EXPIRED because the reviewing desk did not act upon it within 4 days. Please contact administration.`
                        });
                    }
                }
            }
        }
    });
};

module.exports = { initCronJobs };
