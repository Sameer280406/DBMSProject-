const sendEmail = async ({ to, subject, text }) => {
    console.log(`\n================= MOCK EMAIL =================`);
    console.log(`To:      ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`\n${text}`);
    console.log(`==============================================\n`);
    return { success: true };
};

module.exports = { sendEmail };
