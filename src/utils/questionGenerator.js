// Dynamic Question Generation Engine for JobConnect
// Generates tailored 3–5 screening questions based on job title, skills, experience, and role domain.

export const STANDARD_JOINING_QUESTION = {
    id: 'q_joining',
    question: 'When can you join if selected?',
    type: 'multiple_choice',
    options: [
        'Immediately',
        'Within 7 days',
        'Within 15 days',
        'Within 30 days',
        'More than 30 days'
    ],
    required: true,
    isAvailability: true
};

export const STANDARD_INTERVIEW_QUESTION = {
    id: 'q_interview',
    question: 'When are you available for an interview?',
    type: 'multiple_choice',
    options: [
        'Anytime',
        'Within the next 7 days',
        'Within the next 15 days',
        'Need advance notice'
    ],
    required: true,
    isAvailability: true
};

export function generateDynamicQuestions(job = {}) {
    const title = (job.job_title || job.title || job.jobTitle || '').toLowerCase();
    const skillsRaw = job.required_skills || job.skills || '';
    const skillsList = Array.isArray(skillsRaw) 
        ? skillsRaw 
        : typeof skillsRaw === 'string' 
            ? skillsRaw.split(',').map(s => s.trim()).filter(Boolean) 
            : [];

    let roleQuestions = [];

    if (title.includes('data analyst') || title.includes('analytics') || title.includes('business analyst') || title.includes('data science')) {
        roleQuestions = [
            {
                id: 'q_data_familiarity',
                question: 'How familiar are you with Data Analytics & Business Intelligence?',
                type: 'multiple_choice',
                options: ['Beginner', 'Basic Knowledge', 'Intermediate', 'Advanced'],
                required: true
            },
            {
                id: 'q_data_skills',
                question: 'Which of the following analytics tools and technologies do you have experience with?',
                type: 'multi_select',
                options: ['Excel & Advanced Formulas', 'SQL Database Querying', 'Python for Data Analysis', 'Power BI', 'Tableau', 'Data Visualization', 'Other'],
                required: true
            },
            {
                id: 'q_data_exp',
                question: 'How much relevant experience do you have in data analysis or reporting?',
                type: 'multiple_choice',
                options: ['Fresher', 'Less than 1 year', '1–2 years', '2–3 years', '3+ years'],
                required: true
            }
        ];
    } else if (title.includes('digital market') || title.includes('seo') || title.includes('sem') || title.includes('social media') || title.includes('marketing')) {
        roleQuestions = [
            {
                id: 'q_mkt_skills',
                question: 'Which digital marketing skills and domains do you have experience in?',
                type: 'multi_select',
                options: ['Search Engine Optimization (SEO)', 'Google Ads / SEM', 'Social Media Marketing', 'Content Strategy & Copywriting', 'Meta Ads (Facebook & Instagram)', 'Email Marketing / Automation'],
                required: true
            },
            {
                id: 'q_mkt_exp',
                question: 'Do you have hands-on experience managing campaigns and measuring analytics?',
                type: 'multiple_choice',
                options: ['Yes – Managed Live Campaigns', 'Yes – Assisted in Campaigns', 'Academic / Theoretical Knowledge', 'Beginner / No Prior Experience'],
                required: true
            },
            {
                id: 'q_mkt_tools',
                question: 'Which marketing and analytics tools have you actively used?',
                type: 'multi_select',
                options: ['Google Analytics / GA4', 'Google Search Console', 'Semrush / Ahrefs', 'Canva / Photoshop', 'Mailchimp / HubSpot', 'WordPress / CMS'],
                required: true
            }
        ];
    } else if (title.includes('frontend') || title.includes('react') || title.includes('ui') || title.includes('web developer')) {
        roleQuestions = [
            {
                id: 'q_fe_skills',
                question: 'Which frontend technologies and frameworks are you proficient in?',
                type: 'multi_select',
                options: ['HTML5 & Modern CSS3', 'JavaScript (ES6+)', 'React.js', 'Next.js', 'TypeScript', 'Tailwind CSS / Bootstrap'],
                required: true
            },
            {
                id: 'q_fe_react',
                question: 'Do you have hands-on project experience with React.js or Modern JavaScript?',
                type: 'multiple_choice',
                options: ['Yes – Production Experience', 'Yes – Personal & Academic Projects', 'Basic Knowledge / Currently Learning', 'No Prior React Experience'],
                required: true
            },
            {
                id: 'q_fe_projects',
                question: 'How many responsive web applications or UI projects have you built?',
                type: 'multiple_choice',
                options: ['Fresher (1-2 Academic Projects)', '3–5 Completed Projects', '5+ Production Applications', 'None yet'],
                required: true
            }
        ];
    } else if (title.includes('backend') || title.includes('node') || title.includes('python') || title.includes('java') || title.includes('full stack') || title.includes('software engineer') || title.includes('developer')) {
        roleQuestions = [
            {
                id: 'q_be_skills',
                question: 'Which backend programming languages and frameworks do you know?',
                type: 'multi_select',
                options: ['Node.js & Express', 'Python (Django / FastAPI)', 'Java & Spring Boot', 'PHP & Laravel', 'C# / .NET', 'RESTful API Architecture'],
                required: true
            },
            {
                id: 'q_be_db',
                question: 'Which databases have you worked with for data storage and modeling?',
                type: 'multi_select',
                options: ['MySQL / MariaDB', 'PostgreSQL', 'MongoDB / NoSQL', 'SQLite', 'Redis / Caching', 'Firebase / Supabase'],
                required: true
            },
            {
                id: 'q_be_api',
                question: 'Do you have experience building, testing, and securing REST APIs?',
                type: 'multiple_choice',
                options: ['Yes – Advanced API & Auth Architecture', 'Yes – Standard CRUD REST APIs', 'Basic Understanding', 'No Prior API Experience'],
                required: true
            }
        ];
    } else if (title.includes('sales') || title.includes('business development') || title.includes('bde') || title.includes('account executive')) {
        roleQuestions = [
            {
                id: 'q_sales_skills',
                question: 'Which sales and business development skills do you possess?',
                type: 'multi_select',
                options: ['B2B Sales', 'Lead Generation & Cold Calling', 'Client Relationship Management', 'Negotiation & Closing Deals', 'CRM Tools (HubSpot/Salesforce)'],
                required: true
            },
            {
                id: 'q_sales_comm',
                question: 'How would you rate your verbal communication and client presentation skills?',
                type: 'multiple_choice',
                options: ['Excellent / Fluent in English & Local Languages', 'Good Communication Skills', 'Moderate', 'Developing'],
                required: true
            },
            {
                id: 'q_sales_exp',
                question: 'What is your prior experience in meeting sales quotas or target-driven roles?',
                type: 'multiple_choice',
                options: ['Fresher eager to learn', 'Less than 1 year', '1–2 years with proven track record', '3+ years experienced sales executive'],
                required: true
            }
        ];
    } else if (title.includes('hr') || title.includes('human resource') || title.includes('recruiter') || title.includes('talent')) {
        roleQuestions = [
            {
                id: 'q_hr_skills',
                question: 'Which HR functions and recruitment tools are you familiar with?',
                type: 'multi_select',
                options: ['Candidate Sourcing & Screening', 'Job Portal Management (Naukri/LinkedIn)', 'Interview Scheduling & Coordination', 'Onboarding & Documentation', 'Employee Relations & HR Policies'],
                required: true
            },
            {
                id: 'q_hr_exp',
                question: 'How much experience do you have in end-to-end recruitment or HR operations?',
                type: 'multiple_choice',
                options: ['Fresher (HR Specialization / MBA)', 'Less than 1 year', '1–2 years', '3+ years'],
                required: true
            }
        ];
    } else {
        // Generic fallback tailored with parsed skills
        const optionsList = skillsList.length > 0 ? skillsList.slice(0, 6) : ['Core Domain Skills', 'Communication', 'Problem Solving', 'Team Collaboration', 'Technical Tools'];
        roleQuestions = [
            {
                id: 'q_gen_skills',
                question: `Which of the key skills required for ${job.job_title || job.title || 'this role'} do you possess?`,
                type: 'multi_select',
                options: optionsList,
                required: true
            },
            {
                id: 'q_gen_exp',
                question: `What is your total relevant experience related to this position?`,
                type: 'multiple_choice',
                options: ['Fresher / Entry Level', 'Less than 1 year', '1–2 years', '2–3 years', '3+ years'],
                required: true
            }
        ];
    }

    // Always combine with standard joining and interview availability questions
    return [
        ...roleQuestions,
        STANDARD_JOINING_QUESTION,
        STANDARD_INTERVIEW_QUESTION
    ];
}

export function getJobApplicationQuestions(job = {}) {
    // If employer defined custom questions, use them
    let customQuestions = job.application_questions || job.applicationQuestions;
    if (typeof customQuestions === 'string' && customQuestions.trim().startsWith('[')) {
        try {
            customQuestions = JSON.parse(customQuestions);
        } catch (e) {
            customQuestions = null;
        }
    }

    if (Array.isArray(customQuestions) && customQuestions.length > 0) {
        // Ensure availability questions exist
        const hasJoining = customQuestions.some(q => q.id === 'q_joining' || q.question.toLowerCase().includes('join'));
        const hasInterview = customQuestions.some(q => q.id === 'q_interview' || q.question.toLowerCase().includes('interview'));

        const list = [...customQuestions];
        if (!hasJoining) list.push(STANDARD_JOINING_QUESTION);
        if (!hasInterview) list.push(STANDARD_INTERVIEW_QUESTION);
        return list;
    }

    // Otherwise generate dynamic questions tailored to the job
    return generateDynamicQuestions(job);
}
