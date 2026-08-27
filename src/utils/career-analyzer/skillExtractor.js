/**
 * Skill Extractor — Identifies skills from resume text using keyword matching
 * Contains a curated database of 200+ technical and soft skills
 */

// Comprehensive skills database organized by category
const SKILLS_DATABASE = {
    'Programming Languages': [
        'JavaScript', 'Python', 'Java', 'C++', 'C#', 'C', 'TypeScript', 'Ruby', 'PHP', 'Swift',
        'Kotlin', 'Go', 'Rust', 'Scala', 'Perl', 'R', 'MATLAB', 'Dart', 'Lua', 'Shell',
        'Bash', 'PowerShell', 'SQL', 'HTML', 'CSS', 'SASS', 'LESS', 'Objective-C',
        'Assembly', 'Haskell', 'Elixir', 'Clojure', 'F#', 'Visual Basic', 'COBOL',
        'Groovy', 'Julia', 'Solidity'
    ],
    'Frontend Frameworks': [
        'React', 'React.js', 'ReactJS', 'Angular', 'AngularJS', 'Vue', 'Vue.js', 'VueJS',
        'Next.js', 'NextJS', 'Nuxt.js', 'Svelte', 'SvelteKit', 'Ember.js', 'Backbone.js',
        'jQuery', 'Bootstrap', 'Tailwind CSS', 'TailwindCSS', 'Material UI', 'MUI',
        'Chakra UI', 'Ant Design', 'Styled Components', 'Redux', 'Zustand', 'MobX',
        'Gatsby', 'Remix', 'Astro', 'Vite'
    ],
    'Backend Frameworks': [
        'Node.js', 'NodeJS', 'Express', 'Express.js', 'Django', 'Flask', 'FastAPI',
        'Spring Boot', 'Spring', 'Ruby on Rails', 'Rails', 'Laravel', 'Symfony',
        'ASP.NET', '.NET', 'NestJS', 'Koa', 'Hapi', 'Fastify', 'Gin', 'Echo',
        'Fiber', 'Phoenix', 'Actix', 'Rocket'
    ],
    'Databases': [
        'MySQL', 'PostgreSQL', 'MongoDB', 'SQLite', 'Redis', 'Oracle', 'SQL Server',
        'Cassandra', 'DynamoDB', 'Firebase', 'Firestore', 'Supabase', 'CouchDB',
        'Neo4j', 'Elasticsearch', 'MariaDB', 'InfluxDB', 'TimescaleDB', 'PlanetScale',
        'Prisma', 'Sequelize', 'Mongoose', 'TypeORM', 'Drizzle'
    ],
    'Cloud & DevOps': [
        'AWS', 'Amazon Web Services', 'Azure', 'Google Cloud', 'GCP', 'Docker',
        'Kubernetes', 'Jenkins', 'GitHub Actions', 'GitLab CI', 'CircleCI', 'Travis CI',
        'Terraform', 'Ansible', 'Puppet', 'Chef', 'Nginx', 'Apache', 'Heroku',
        'Vercel', 'Netlify', 'DigitalOcean', 'Cloudflare', 'Linux', 'Ubuntu',
        'CI/CD', 'DevOps', 'Microservices', 'Serverless', 'Lambda'
    ],
    'Mobile Development': [
        'React Native', 'Flutter', 'Android', 'iOS', 'Xcode', 'Android Studio',
        'SwiftUI', 'Jetpack Compose', 'Ionic', 'Capacitor', 'Cordova', 'Xamarin',
        'Expo', 'Mobile Development', 'App Development'
    ],
    'Data Science & AI': [
        'Machine Learning', 'Deep Learning', 'Artificial Intelligence', 'AI', 'ML',
        'TensorFlow', 'PyTorch', 'Keras', 'Scikit-learn', 'Pandas', 'NumPy',
        'Matplotlib', 'Data Science', 'Data Analysis', 'Data Visualization',
        'NLP', 'Natural Language Processing', 'Computer Vision', 'OpenCV',
        'Neural Networks', 'Random Forest', 'SVM', 'Regression', 'Classification',
        'Clustering', 'Big Data', 'Hadoop', 'Spark', 'Apache Spark',
        'Tableau', 'Power BI', 'Jupyter', 'Anaconda', 'Statistics',
        'ChatGPT', 'OpenAI', 'LLM', 'Generative AI', 'Prompt Engineering'
    ],
    'Tools & Platforms': [
        'Git', 'GitHub', 'GitLab', 'Bitbucket', 'Jira', 'Trello', 'Asana',
        'Slack', 'VS Code', 'Visual Studio', 'IntelliJ', 'Eclipse', 'PyCharm',
        'Postman', 'Insomnia', 'Swagger', 'Figma', 'Adobe XD', 'Sketch',
        'Photoshop', 'Illustrator', 'Canva', 'Notion', 'Confluence',
        'Webpack', 'Babel', 'ESLint', 'Prettier', 'npm', 'yarn', 'pnpm',
        'REST API', 'GraphQL', 'WebSocket', 'gRPC', 'Agile', 'Scrum',
        'Kanban', 'SDLC', 'Linux', 'Windows', 'macOS'
    ],
    'Cybersecurity': [
        'Cybersecurity', 'Penetration Testing', 'Ethical Hacking', 'OWASP',
        'Firewall', 'Encryption', 'SSL', 'TLS', 'OAuth', 'JWT',
        'SIEM', 'Vulnerability Assessment', 'Network Security', 'SOC',
        'Malware Analysis', 'Incident Response', 'Information Security'
    ],
    'Soft Skills': [
        'Leadership', 'Communication', 'Teamwork', 'Problem Solving', 'Critical Thinking',
        'Project Management', 'Time Management', 'Adaptability', 'Creativity',
        'Collaboration', 'Presentation', 'Negotiation', 'Decision Making',
        'Analytical', 'Strategic Thinking', 'Mentoring', 'Public Speaking',
        'Conflict Resolution', 'Customer Service', 'Detail Oriented'
    ]
};

/**
 * Extract skills from resume text
 * @param {string} text - The resume text content
 * @returns {Object} - Extracted skills categorized with details
 */
export const extractSkillsFromText = (text) => {
    if (!text || text.trim().length === 0) {
        return { skills: [], categorized: {}, totalFound: 0 };
    }

    const normalizedText = text.toLowerCase();
    const foundSkills = [];
    const categorized = {};

    for (const [category, skills] of Object.entries(SKILLS_DATABASE)) {
        const categoryMatches = [];

        for (const skill of skills) {
            // Create a regex that matches whole words (case insensitive)
            const escapedSkill = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`\\b${escapedSkill}\\b`, 'i');

            if (regex.test(text)) {
                // Avoid duplicate base skills (e.g., React and React.js)
                const baseSkill = skill.replace(/\.js$/i, '').replace(/JS$/i, '');
                const alreadyFound = foundSkills.some(s => {
                    const sBase = s.name.replace(/\.js$/i, '').replace(/JS$/i, '');
                    return sBase.toLowerCase() === baseSkill.toLowerCase();
                });

                if (!alreadyFound) {
                    const skillObj = { name: skill, category };
                    foundSkills.push(skillObj);
                    categoryMatches.push(skill);
                }
            }
        }

        if (categoryMatches.length > 0) {
            categorized[category] = categoryMatches;
        }
    }

    return {
        skills: foundSkills.map(s => s.name),
        categorized,
        totalFound: foundSkills.length
    };
};

/**
 * Get just the skill names as a flat array
 * @param {string} text
 * @returns {string[]}
 */
export const getSkillNames = (text) => {
    const result = extractSkillsFromText(text);
    return result.skills;
};

export { SKILLS_DATABASE };
