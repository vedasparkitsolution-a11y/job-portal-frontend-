/**
 * Email Service — Send email notifications via EmailJS
 * Supports single and bulk email sending
 * Free tier: 200 emails/month
 */
import { init, send } from '@emailjs/browser';

// EmailJS Configuration
const EMAILJS_CONFIG = {
    serviceId: 'service_ubq9cyf',
    templateId: 'template_jsot3ra',       // Job application template
    bulkTemplateId: 'template_jsot3ra',   // Bulk/admin email template
    publicKey: 'TvJtt_vzIDtJAYHtT'
};

// Initialize EmailJS
init(EMAILJS_CONFIG.publicKey);

/**
 * Send job application confirmation email
 * Dynamically sends to the applicant's email address
 */
export const sendApplicationEmail = async (applicationData) => {
    try {
        const templateParams = {
            to_email: applicationData.userEmail, // Dynamic recipient
            user_name: applicationData.userName || 'User',
            user_email: applicationData.userEmail,
            job_title: applicationData.jobTitle,
            match_percentage: applicationData.matchPercentage,
            salary_range: applicationData.salaryRange,
            company_type: applicationData.companyType || 'N/A',
            matched_skills: applicationData.matchedSkills || 'N/A',
            applied_date: new Date().toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })
        };

        console.log('Sending dynamic email to:', templateParams.to_email);
        console.log('Sending from domain:', window.location.origin);

        const response = await send(
            EMAILJS_CONFIG.serviceId,
            EMAILJS_CONFIG.templateId,
            templateParams,
            EMAILJS_CONFIG.publicKey
        );

        console.log('Application email sent successfully:', response);
        return { success: true, message: `Confirmation email sent to ${templateParams.to_email}` };
    } catch (error) {
        console.error('EmailJS Error Details:', {
            status: error?.status,
            text: error?.text,
            message: error?.message,
            fullError: error
        });

        let errorMsg = error?.text || error?.message || 'Unknown error';
        if (error?.status === 412) {
            const currentDomain = window.location.origin;
            errorMsg = `Domain Restriction Error (412). Current domain: ${currentDomain}. Go to EmailJS Dashboard → Account → Security and disable domain restrictions, or create a new EmailJS account.`;
        }

        return { success: false, message: `Email failed: ${errorMsg}` };
    }
};

/**
 * Send profile submission confirmation email
 * Triggered after user completes the career analysis wizard
 */
export const sendProfileSubmissionEmail = async (formData) => {
    try {
        console.log('Attempting to send analysis confirmation to:', formData.email);

        if (!formData.email) {
            console.error('No email found in formData:', formData);
            return { success: false, message: 'No email address provided.' };
        }

        const templateParams = {
            to_email: formData.email, // Dynamic recipient
            user_name: formData.fullName || 'User',
            user_email: formData.email,
            subject: 'Your Career Analysis Report is Ready!',
            message: `Hi ${formData.fullName || 'User'},\n\nThank you for submitting your profile to Career Analyser. Your career analysis has been completed successfully.\n\nSummary of your submission:\n- Name: ${formData.fullName}\n- Email: ${formData.email}\n- Qualification: ${formData.qualification}\n- Field: ${formData.fieldOfStudy}\n\nYou can view your full report and job recommendations anytime on your dashboard.\n\nBest regards,\nCareer Analyser Team`,
            // Provide defaults for other template fields if needed
            job_title: 'Career Profile Analysis',
            match_percentage: '',
            salary_range: '',
            company_type: '',
            matched_skills: (formData.skills || []).join(', '),
            applied_date: new Date().toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })
        };

        console.log('Final template params for analysis email:', templateParams);

        const response = await send(
            EMAILJS_CONFIG.serviceId,
            EMAILJS_CONFIG.templateId,
            templateParams,
            EMAILJS_CONFIG.publicKey
        );

        console.log('Profile submission email sent successfully to:', templateParams.to_email);
        return { success: true, message: `Analysis confirmation sent to ${templateParams.to_email}!` };
    } catch (error) {
        console.error('EmailJS Profile Email Error:', {
            status: error?.status,
            text: error?.text,
            message: error?.message,
            fullError: error
        });

        let errorMsg = error?.text || error?.message || 'Unknown error';
        if (error?.status === 412) {
            const currentDomain = window.location.origin;
            errorMsg = `Domain Restriction Error (412). Current domain: ${currentDomain}. Go to EmailJS Dashboard → Account → Security and disable domain restrictions, or create a new EmailJS account.`;
        }

        return { success: false, message: `Email failed: ${errorMsg}` };
    }
};

/**
 * Fetch all registered users from Firestore
 * @returns {Promise<Array>} Array of user objects with {uid, name, email, lastLogin, createdAt}
 */
export const fetchAllUsers = async () => {
    return { success: true, users: [] };
};

/**
 * Send bulk email to multiple users with batching and delay
 * @param {Array} users - Array of {name, email} objects
 * @param {string} subject - Email subject
 * @param {string} message - Email body (HTML supported)
 * @param {Function} onProgress - Callback for progress updates (index, total)
 * @returns {Promise<Object>} Results with success/failure counts
 */
export const sendBulkEmail = async (users, subject, message, onProgress) => {
    const results = {
        total: users.length,
        successCount: 0,
        failedCount: 0,
        failedEmails: []
    };

    const BATCH_SIZE = 5;
    const DELAY_MS = 1000; // 1 second delay between batches

    for (let i = 0; i < users.length; i += BATCH_SIZE) {
        const batch = users.slice(i, i + BATCH_SIZE);

        // Send batch in parallel
        const batchPromises = batch.map(async (user) => {
            try {
                const templateParams = {
                    to_email: user.email, // Dynamic recipient
                    user_name: user.name || 'User',
                    user_email: user.email,
                    subject: subject,
                    message: message,
                    // These fields are required by existing template — provide defaults
                    job_title: subject,
                    match_percentage: '',
                    salary_range: '',
                    company_type: '',
                    matched_skills: '',
                    applied_date: new Date().toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })
                };

                await send(
                    EMAILJS_CONFIG.serviceId,
                    EMAILJS_CONFIG.bulkTemplateId,
                    templateParams,
                    EMAILJS_CONFIG.publicKey
                );

                results.successCount++;
            } catch (error) {
                console.error(`Failed to send to ${user.email}:`, error);
                results.failedCount++;
                results.failedEmails.push(user.email);
            }
        });

        await Promise.all(batchPromises);

        // Report progress
        if (onProgress) {
            onProgress(Math.min(i + BATCH_SIZE, users.length), users.length);
        }

        // Delay between batches to respect rate limits
        if (i + BATCH_SIZE < users.length) {
            await new Promise(resolve => setTimeout(resolve, DELAY_MS));
        }
    }

    return results;
};

/**
 * Save email send log to Firestore
 */
export const saveEmailLog = async (logData) => {
    try {
        const logsRef = collection(db, 'emailLogs');
        await addDoc(logsRef, {
            ...logData,
            sentAt: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error('Failed to save email log:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Fetch recent email logs from Firestore
 * @param {number} count - Number of logs to fetch
 */
export const fetchEmailLogs = async (count = 10) => {
    try {
        const logsRef = collection(db, 'emailLogs');
        const q = query(logsRef, orderBy('sentAt', 'desc'), limit(count));
        const snapshot = await getDocs(q);
        const logs = [];
        snapshot.forEach((docSnap) => {
            logs.push({
                id: docSnap.id,
                ...docSnap.data()
            });
        });
        return { success: true, logs };
    } catch (error) {
        console.error('Failed to fetch email logs:', error);
        return { success: false, logs: [], error: error.message };
    }
};

/**
 * Check if EmailJS is properly configured
 */
export const isEmailConfigured = () => {
    return EMAILJS_CONFIG.serviceId !== 'YOUR_SERVICE_ID' &&
        EMAILJS_CONFIG.templateId !== 'YOUR_TEMPLATE_ID' &&
        EMAILJS_CONFIG.publicKey !== 'YOUR_PUBLIC_KEY';
};
