/**
 * Job Database — 30+ job roles with required skills, salary ranges, and descriptions
 */

const JOB_DATABASE = [
    {
        id: 1,
        title: 'Frontend Developer',
        description: 'Build responsive web interfaces using modern JavaScript frameworks. Create pixel-perfect UI components and ensure cross-browser compatibility.',
        requiredSkills: ['JavaScript', 'React', 'HTML', 'CSS', 'TypeScript', 'Redux', 'Git'],
        preferredSkills: ['Next.js', 'Tailwind CSS', 'Figma', 'Jest', 'Webpack'],
        salaryRange: '₹4L - ₹10L',
        experienceLevel: 'fresher',
        companyType: 'Product / Startup',
        industry: 'Technology'
    },
    {
        id: 2,
        title: 'Senior Frontend Developer',
        description: 'Lead frontend architecture decisions and mentor junior developers. Design scalable component libraries and optimize performance.',
        requiredSkills: ['JavaScript', 'React', 'TypeScript', 'HTML', 'CSS', 'Redux', 'Git'],
        preferredSkills: ['Next.js', 'GraphQL', 'Webpack', 'Performance Optimization', 'Leadership'],
        salaryRange: '₹12L - ₹25L',
        experienceLevel: 'experienced',
        companyType: 'Product Company',
        industry: 'Technology'
    },
    {
        id: 3,
        title: 'Full Stack Developer',
        description: 'Develop end-to-end web applications with both frontend and backend components. Work with databases and RESTful APIs.',
        requiredSkills: ['JavaScript', 'React', 'Node.js', 'Express', 'MongoDB', 'SQL', 'Git'],
        preferredSkills: ['TypeScript', 'Docker', 'AWS', 'Redis', 'GraphQL'],
        salaryRange: '₹6L - ₹15L',
        experienceLevel: 'fresher',
        companyType: 'Product / Service',
        industry: 'Technology'
    },
    {
        id: 4,
        title: 'Backend Developer',
        description: 'Design and implement server-side logic, APIs, and database architecture. Ensure high performance and security.',
        requiredSkills: ['Node.js', 'Python', 'SQL', 'MongoDB', 'REST API', 'Git'],
        preferredSkills: ['Docker', 'AWS', 'Microservices', 'Redis', 'GraphQL'],
        salaryRange: '₹5L - ₹14L',
        experienceLevel: 'fresher',
        companyType: 'Product Company',
        industry: 'Technology'
    },
    {
        id: 5,
        title: 'Python Developer',
        description: 'Develop Python-based applications, automation scripts, and backend services. Work with data processing pipelines.',
        requiredSkills: ['Python', 'Django', 'Flask', 'SQL', 'REST API', 'Git'],
        preferredSkills: ['FastAPI', 'Docker', 'AWS', 'Celery', 'Redis'],
        salaryRange: '₹4L - ₹12L',
        experienceLevel: 'fresher',
        companyType: 'Product / Service',
        industry: 'Technology'
    },
    {
        id: 6,
        title: 'Data Scientist',
        description: 'Analyze complex datasets, build predictive models, and derive actionable insights. Use ML algorithms for business solutions.',
        requiredSkills: ['Python', 'Machine Learning', 'Pandas', 'NumPy', 'SQL', 'Statistics'],
        preferredSkills: ['TensorFlow', 'Scikit-learn', 'Tableau', 'Deep Learning', 'R'],
        salaryRange: '₹6L - ₹20L',
        experienceLevel: 'fresher',
        companyType: 'Product / Research',
        industry: 'Data & Analytics'
    },
    {
        id: 7,
        title: 'Machine Learning Engineer',
        description: 'Design and deploy ML models at scale. Build training pipelines and optimize model performance for production.',
        requiredSkills: ['Python', 'Machine Learning', 'TensorFlow', 'Deep Learning', 'SQL'],
        preferredSkills: ['PyTorch', 'AWS', 'Docker', 'MLOps', 'Computer Vision'],
        salaryRange: '₹8L - ₹25L',
        experienceLevel: 'experienced',
        companyType: 'Tech / Research',
        industry: 'AI & Machine Learning'
    },
    {
        id: 8,
        title: 'AI Engineer',
        description: 'Build AI-powered solutions using LLMs, NLP, and generative AI. Integrate AI capabilities into products.',
        requiredSkills: ['Python', 'Machine Learning', 'NLP', 'Deep Learning', 'TensorFlow'],
        preferredSkills: ['OpenAI', 'LLM', 'Generative AI', 'PyTorch', 'Computer Vision'],
        salaryRange: '₹10L - ₹30L',
        experienceLevel: 'experienced',
        companyType: 'Product / Research',
        industry: 'AI & Machine Learning'
    },
    {
        id: 9,
        title: 'Mobile App Developer (React Native)',
        description: 'Build cross-platform mobile applications using React Native. Implement native features and ensure smooth performance.',
        requiredSkills: ['JavaScript', 'React Native', 'React', 'Mobile Development'],
        preferredSkills: ['TypeScript', 'Redux', 'Firebase', 'Expo', 'iOS', 'Android'],
        salaryRange: '₹5L - ₹15L',
        experienceLevel: 'fresher',
        companyType: 'Startup / Product',
        industry: 'Mobile'
    },
    {
        id: 10,
        title: 'Flutter Developer',
        description: 'Create beautiful cross-platform mobile apps using Flutter and Dart. Deliver native-quality experiences on iOS and Android.',
        requiredSkills: ['Flutter', 'Dart', 'Mobile Development'],
        preferredSkills: ['Firebase', 'REST API', 'Git', 'iOS', 'Android', 'Figma'],
        salaryRange: '₹4L - ₹14L',
        experienceLevel: 'fresher',
        companyType: 'Startup / Product',
        industry: 'Mobile'
    },
    {
        id: 11,
        title: 'Android Developer',
        description: 'Build native Android applications using Kotlin/Java. Integrate with backend services and optimize app performance.',
        requiredSkills: ['Android', 'Kotlin', 'Java', 'Android Studio'],
        preferredSkills: ['Jetpack Compose', 'Firebase', 'REST API', 'Git', 'MVVM'],
        salaryRange: '₹4L - ₹12L',
        experienceLevel: 'fresher',
        companyType: 'Product / Service',
        industry: 'Mobile'
    },
    {
        id: 12,
        title: 'iOS Developer',
        description: 'Develop native iOS applications using Swift. Create intuitive interfaces and leverage Apple ecosystem features.',
        requiredSkills: ['Swift', 'iOS', 'Xcode', 'SwiftUI'],
        preferredSkills: ['Objective-C', 'Core Data', 'Firebase', 'Git', 'REST API'],
        salaryRange: '₹5L - ₹16L',
        experienceLevel: 'fresher',
        companyType: 'Product Company',
        industry: 'Mobile'
    },
    {
        id: 13,
        title: 'DevOps Engineer',
        description: 'Automate deployment pipelines, manage cloud infrastructure, and ensure system reliability. Implement CI/CD practices.',
        requiredSkills: ['Docker', 'Kubernetes', 'AWS', 'Linux', 'CI/CD', 'Git'],
        preferredSkills: ['Terraform', 'Jenkins', 'Ansible', 'Monitoring', 'Python'],
        salaryRange: '₹6L - ₹20L',
        experienceLevel: 'experienced',
        companyType: 'Product / Enterprise',
        industry: 'Cloud & Infrastructure'
    },
    {
        id: 14,
        title: 'Cloud Engineer',
        description: 'Design and maintain cloud-based systems and services. Optimize costs and ensure scalability of infrastructure.',
        requiredSkills: ['AWS', 'Azure', 'Linux', 'Docker', 'Networking'],
        preferredSkills: ['Kubernetes', 'Terraform', 'Python', 'Serverless', 'CI/CD'],
        salaryRange: '₹7L - ₹22L',
        experienceLevel: 'experienced',
        companyType: 'Enterprise / Product',
        industry: 'Cloud & Infrastructure'
    },
    {
        id: 15,
        title: 'Database Administrator',
        description: 'Manage and optimize database systems. Ensure data integrity, performance tuning, and backup strategies.',
        requiredSkills: ['SQL', 'MySQL', 'PostgreSQL', 'Oracle', 'Database'],
        preferredSkills: ['MongoDB', 'Redis', 'Performance Optimization', 'Linux', 'Python'],
        salaryRange: '₹5L - ₹15L',
        experienceLevel: 'experienced',
        companyType: 'Enterprise',
        industry: 'Data & Analytics'
    },
    {
        id: 16,
        title: 'Cybersecurity Analyst',
        description: 'Monitor and protect systems from security threats. Conduct vulnerability assessments and implement security measures.',
        requiredSkills: ['Cybersecurity', 'Network Security', 'Linux', 'Firewall'],
        preferredSkills: ['Penetration Testing', 'SIEM', 'Ethical Hacking', 'OWASP', 'Python'],
        salaryRange: '₹5L - ₹18L',
        experienceLevel: 'fresher',
        companyType: 'Enterprise / Consulting',
        industry: 'Cybersecurity'
    },
    {
        id: 17,
        title: 'Ethical Hacker',
        description: 'Perform penetration testing and security audits. Identify vulnerabilities before malicious actors can exploit them.',
        requiredSkills: ['Penetration Testing', 'Ethical Hacking', 'Linux', 'Cybersecurity'],
        preferredSkills: ['OWASP', 'Python', 'Network Security', 'Malware Analysis', 'Bash'],
        salaryRange: '₹6L - ₹20L',
        experienceLevel: 'experienced',
        companyType: 'Security Firm',
        industry: 'Cybersecurity'
    },
    {
        id: 18,
        title: 'UI/UX Designer',
        description: 'Design intuitive user interfaces and seamless user experiences. Create wireframes, prototypes, and design systems.',
        requiredSkills: ['Figma', 'Adobe XD', 'HTML', 'CSS'],
        preferredSkills: ['Photoshop', 'Illustrator', 'Sketch', 'Canva', 'JavaScript'],
        salaryRange: '₹4L - ₹14L',
        experienceLevel: 'fresher',
        companyType: 'Product / Agency',
        industry: 'Design'
    },
    {
        id: 19,
        title: 'Data Analyst',
        description: 'Analyze business data and create reports and dashboards. Transform raw data into actionable business insights.',
        requiredSkills: ['SQL', 'Python', 'Data Analysis', 'Statistics'],
        preferredSkills: ['Tableau', 'Power BI', 'Pandas', 'Excel', 'R'],
        salaryRange: '₹3L - ₹10L',
        experienceLevel: 'fresher',
        companyType: 'Any Industry',
        industry: 'Data & Analytics'
    },
    {
        id: 20,
        title: 'QA Engineer',
        description: 'Design and execute test plans for software quality. Automate testing processes and ensure bug-free releases.',
        requiredSkills: ['Testing', 'SQL', 'Git', 'Agile'],
        preferredSkills: ['Selenium', 'Cypress', 'Jest', 'Python', 'JavaScript', 'Jira'],
        salaryRange: '₹3L - ₹10L',
        experienceLevel: 'fresher',
        companyType: 'Product / Service',
        industry: 'Technology'
    },
    {
        id: 21,
        title: 'Java Developer',
        description: 'Build enterprise applications using Java and Spring framework. Develop microservices and maintain legacy systems.',
        requiredSkills: ['Java', 'Spring Boot', 'SQL', 'REST API', 'Git'],
        preferredSkills: ['Microservices', 'Docker', 'Kubernetes', 'AWS', 'Hibernate'],
        salaryRange: '₹5L - ₹15L',
        experienceLevel: 'fresher',
        companyType: 'Enterprise / Service',
        industry: 'Technology'
    },
    {
        id: 22,
        title: 'PHP Developer',
        description: 'Develop web applications using PHP and related frameworks. Build content management systems and e-commerce platforms.',
        requiredSkills: ['PHP', 'Laravel', 'MySQL', 'HTML', 'CSS', 'JavaScript'],
        preferredSkills: ['Symfony', 'REST API', 'Docker', 'Git', 'Redis'],
        salaryRange: '₹3L - ₹10L',
        experienceLevel: 'fresher',
        companyType: 'Service / Startup',
        industry: 'Web Development'
    },
    {
        id: 23,
        title: 'WordPress Developer',
        description: 'Build and customize WordPress websites and plugins. Create responsive themes and optimize site performance.',
        requiredSkills: ['PHP', 'HTML', 'CSS', 'JavaScript', 'MySQL'],
        preferredSkills: ['WordPress', 'REST API', 'Git', 'SEO', 'Photoshop'],
        salaryRange: '₹2L - ₹7L',
        experienceLevel: 'fresher',
        companyType: 'Agency / Freelance',
        industry: 'Web Development'
    },
    {
        id: 24,
        title: 'Blockchain Developer',
        description: 'Build decentralized applications and smart contracts. Work with blockchain protocols and cryptocurrency systems.',
        requiredSkills: ['Solidity', 'JavaScript', 'Blockchain'],
        preferredSkills: ['Ethereum', 'Web3', 'React', 'Node.js', 'Python'],
        salaryRange: '₹8L - ₹25L',
        experienceLevel: 'experienced',
        companyType: 'Web3 / Crypto',
        industry: 'Blockchain'
    },
    {
        id: 25,
        title: 'Game Developer',
        description: 'Create interactive games for various platforms. Implement game mechanics, physics engines, and rendering systems.',
        requiredSkills: ['C++', 'C#', 'Game Development'],
        preferredSkills: ['Unity', 'Unreal Engine', 'Python', 'JavaScript', '3D Modeling'],
        salaryRange: '₹4L - ₹15L',
        experienceLevel: 'fresher',
        companyType: 'Gaming Studio',
        industry: 'Gaming'
    },
    {
        id: 26,
        title: 'Technical Writer',
        description: 'Create technical documentation, API docs, and user guides. Translate complex technical concepts into clear content.',
        requiredSkills: ['Communication', 'HTML', 'Git'],
        preferredSkills: ['JavaScript', 'Python', 'Markdown', 'REST API', 'Swagger'],
        salaryRange: '₹3L - ₹10L',
        experienceLevel: 'fresher',
        companyType: 'Product / Tech',
        industry: 'Technology'
    },
    {
        id: 27,
        title: 'Project Manager (IT)',
        description: 'Lead software development projects from planning to delivery. Coordinate teams, manage timelines, and ensure quality.',
        requiredSkills: ['Project Management', 'Agile', 'Scrum', 'Communication', 'Leadership'],
        preferredSkills: ['Jira', 'Trello', 'SDLC', 'Risk Management', 'Negotiation'],
        salaryRange: '₹8L - ₹22L',
        experienceLevel: 'experienced',
        companyType: 'Any',
        industry: 'Technology'
    },
    {
        id: 28,
        title: 'Business Analyst',
        description: 'Bridge the gap between business needs and technical solutions. Gather requirements and define project scope.',
        requiredSkills: ['Communication', 'Analytical', 'SQL', 'Problem Solving'],
        preferredSkills: ['Jira', 'Power BI', 'Tableau', 'Agile', 'Excel'],
        salaryRange: '₹4L - ₹12L',
        experienceLevel: 'fresher',
        companyType: 'Enterprise / Consulting',
        industry: 'Business'
    },
    {
        id: 29,
        title: 'Site Reliability Engineer (SRE)',
        description: 'Ensure reliability and uptime of production systems. Implement monitoring, alerting, and incident response.',
        requiredSkills: ['Linux', 'Docker', 'Kubernetes', 'Python', 'AWS', 'Monitoring'],
        preferredSkills: ['Terraform', 'CI/CD', 'Elasticsearch', 'Grafana', 'Prometheus'],
        salaryRange: '₹10L - ₹28L',
        experienceLevel: 'experienced',
        companyType: 'Product / Enterprise',
        industry: 'Cloud & Infrastructure'
    },
    {
        id: 30,
        title: 'Embedded Systems Engineer',
        description: 'Develop firmware and software for embedded devices. Work with microcontrollers and hardware interfaces.',
        requiredSkills: ['C', 'C++', 'Embedded Systems'],
        preferredSkills: ['Assembly', 'RTOS', 'IoT', 'Linux', 'Python'],
        salaryRange: '₹4L - ₹12L',
        experienceLevel: 'fresher',
        companyType: 'Hardware / IoT',
        industry: 'Electronics'
    },
    {
        id: 31,
        title: 'Network Engineer',
        description: 'Design, implement, and maintain network infrastructure. Troubleshoot connectivity issues and optimize network performance.',
        requiredSkills: ['Networking', 'Linux', 'Firewall', 'Network Security'],
        preferredSkills: ['Cisco', 'AWS', 'Python', 'Bash', 'Monitoring'],
        salaryRange: '₹4L - ₹14L',
        experienceLevel: 'fresher',
        companyType: 'Enterprise / ISP',
        industry: 'Networking'
    },
    {
        id: 32,
        title: 'Angular Developer',
        description: 'Build scalable web apps using Angular framework. Implement complex UI features with RxJS and TypeScript.',
        requiredSkills: ['Angular', 'TypeScript', 'JavaScript', 'HTML', 'CSS', 'RxJS'],
        preferredSkills: ['NgRx', 'REST API', 'Git', 'Node.js', 'Jasmine'],
        salaryRange: '₹5L - ₹14L',
        experienceLevel: 'fresher',
        companyType: 'Enterprise / Product',
        industry: 'Technology'
    }
];

export default JOB_DATABASE;
