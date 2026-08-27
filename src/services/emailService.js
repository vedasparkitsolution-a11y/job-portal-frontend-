import emailjs from 'emailjs-com';

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

export async function sendApplicationNotification({ companyEmail, companyName, applicantName, jobTitle }) {
    if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
        console.warn('EmailJS not configured. Skipping email notification.');
        return;
    }

    try {
        await emailjs.send(SERVICE_ID, TEMPLATE_ID, {
            to_email: companyEmail,
            company_name: companyName,
            applicant_name: applicantName,
            job_title: jobTitle,
            message: `New application received from ${applicantName} for the position: ${jobTitle}.`
        }, PUBLIC_KEY);
    } catch (error) {
        console.error('Failed to send email notification:', error);
    }
}
