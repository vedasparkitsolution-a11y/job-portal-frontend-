/**
 * Automation Service — Handles connection to external automation tools like n8n
 */

// CONFIGURATION: Replace this with your n8n Webhook URL
const N8N_CONFIG = {
    // For local development, it uses the Vite proxy (/api/n8n)
    // For production/hosting, replace 'YOUR_N8N_URL' with your actual n8n instance URL
    webhookUrl: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? '/api/n8n/webhook/career-analyser-trigger'
        : 'https://n8n.your-instance.com/webhook/career-analyser-trigger',
    enabled: false // Disabled by default to prevent timeout errors for new users
};

/**
 * Trigger an automation workflow in n8n
 * @param {string} eventType - Type of event (e.g., 'profile_submission', 'job_application')
 * @param {Object} data - The data to send to n8n
 * @returns {Promise<Object>} Result of the trigger
 */
export const triggerAutomation = async (eventType, data) => {
    if (!N8N_CONFIG.enabled || !N8N_CONFIG.webhookUrl) {
        // console.log(`Automation skipped for ${eventType} (not configured)`);
        return { success: false, message: 'Automation not configured' };
    }

    try {
        console.log(`Triggering n8n automation for: ${eventType}...`);

        const payload = {
            eventType,
            timestamp: new Date().toISOString(),
            ...data
        };

        const response = await fetch(N8N_CONFIG.webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            let errorText = '';
            try {
                errorText = await response.text();
            } catch (e) {
                errorText = 'Could not read error response';
            }
            throw new Error(`n8n responded with status: ${response.status} - ${errorText}`);
        }

        console.log(`✅ n8n automation triggered successfully for ${eventType}`);
        return { success: true };
    } catch (error) {
        console.error(`❌ n8n automation failed for ${eventType}:`, error);
        return { success: false, error: error.message };
    }
};

/**
 * Check if the automation service is configured
 * @returns {boolean}
 */
export const isAutomationEnabled = () => {
    return N8N_CONFIG.enabled && !!N8N_CONFIG.webhookUrl;
};
