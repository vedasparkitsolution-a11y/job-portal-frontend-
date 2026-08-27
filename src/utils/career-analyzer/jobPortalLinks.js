/**
 * Job Portal Links — Generates search URLs for LinkedIn, Naukri, and Glassdoor
 * based on the user's preferred role and optional location.
 */

/**
 * Predefined job roles for the dropdown
 */
export const JOB_ROLES = [
    'Full Stack Developer',
    'Frontend Developer',
    'Backend Developer',
    'Java Developer',
    'Python Developer',
    'Angular Developer',
    'React Developer',
    'Node.js Developer',
    '.NET Developer',
    'PHP Developer',
    'Data Scientist',
    'Data Analyst',
    'Data Engineer',
    'Machine Learning Engineer',
    'AI Engineer',
    'DevOps Engineer',
    'Cloud Engineer',
    'UI/UX Designer',
    'Mobile Developer',
    'Android Developer',
    'iOS Developer',
    'Flutter Developer',
    'QA Engineer',
    'Software Tester',
    'Cybersecurity Analyst',
    'Network Engineer',
    'System Administrator',
    'Database Administrator',
    'Business Analyst',
    'Product Manager',
    'Scrum Master',
    'Technical Writer',
    'Blockchain Developer',
    'Embedded Systems Engineer',
    'Game Developer',
    'Salesforce Developer',
    'SAP Consultant',
    'Power BI Developer',
    'Tableau Developer',
    'ETL Developer',
    'Digital Marketing Specialist',
    'SEO Specialist',
    'Content Writer',
    'Graphic Designer',
    'Video Editor',
];

/**
 * Generate job portal search URLs for a given role and location
 * @param {string} role - The preferred job role
 * @param {string} location - Optional location for search
 * @returns {Array<Object>} Array of portal objects with name, url, color, icon, and description
 */
export const getJobPortalLinks = (role, location = '') => {
    if (!role) return [];

    const encodedRole = encodeURIComponent(role);
    const encodedLocation = location ? encodeURIComponent(location) : '';

    // Format role for Naukri URL (lowercase, hyphen-separated)
    const naukriRole = role.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-');

    const portals = [
        {
            name: 'LinkedIn',
            description: 'Professional network with millions of job listings worldwide',
            url: location
                ? `https://www.linkedin.com/jobs/search/?keywords=${encodedRole}&location=${encodedLocation}`
                : `https://www.linkedin.com/jobs/search/?keywords=${encodedRole}`,
            color: '#0A66C2',
            bgGradient: 'linear-gradient(135deg, #0A66C2, #004182)',
            icon: '💼',
            tagline: 'World\'s Largest Professional Network'
        },
        {
            name: 'Naukri',
            description: 'India\'s #1 job portal with lakhs of opportunities',
            url: location
                ? `https://www.naukri.com/${naukriRole}-jobs-in-${encodedLocation.toLowerCase()}`
                : `https://www.naukri.com/${naukriRole}-jobs`,
            color: '#4A90D9',
            bgGradient: 'linear-gradient(135deg, #4A90D9, #2E5F8A)',
            icon: '🏢',
            tagline: 'India\'s No. 1 Job Site'
        },
        {
            name: 'Glassdoor',
            description: 'Find jobs with company reviews, salaries & interview insights',
            url: `https://www.glassdoor.co.in/Job/jobs.htm?sc.keyword=${encodedRole}`,
            color: '#0CAA41',
            bgGradient: 'linear-gradient(135deg, #0CAA41, #087A2F)',
            icon: '⭐',
            tagline: 'Jobs with Salary & Reviews'
        }
    ];

    return portals;
};
