/**
 * Job Matcher — Matches user skills against job database
 * Calculates match percentage and returns ranked recommendations
 */
import JOB_DATABASE from '../../data/career-analyzer/jobDatabase';

/**
 * Calculate match percentage between user skills and job requirements
 * @param {string[]} userSkills - Array of user's skills
 * @param {Object} job - Job object from database
 * @returns {Object} - Match details
 */
const calculateMatch = (userSkills, job) => {
    const normalizedUserSkills = userSkills.map(s => s.toLowerCase());

    // Check required skills match
    const requiredMatches = job.requiredSkills.filter(skill =>
        normalizedUserSkills.some(us =>
            us.includes(skill.toLowerCase()) || skill.toLowerCase().includes(us)
        )
    );

    // Check preferred skills match
    const preferredMatches = job.preferredSkills.filter(skill =>
        normalizedUserSkills.some(us =>
            us.includes(skill.toLowerCase()) || skill.toLowerCase().includes(us)
        )
    );

    // Calculate weighted score (required skills = 70%, preferred = 30%)
    const requiredScore = job.requiredSkills.length > 0
        ? (requiredMatches.length / job.requiredSkills.length) * 70
        : 0;

    const preferredScore = job.preferredSkills.length > 0
        ? (preferredMatches.length / job.preferredSkills.length) * 30
        : 0;

    const totalScore = Math.round(requiredScore + preferredScore);

    // Identify missing skills (gap analysis)
    const missingRequired = job.requiredSkills.filter(skill =>
        !normalizedUserSkills.some(us =>
            us.includes(skill.toLowerCase()) || skill.toLowerCase().includes(us)
        )
    );

    const missingPreferred = job.preferredSkills.filter(skill =>
        !normalizedUserSkills.some(us =>
            us.includes(skill.toLowerCase()) || skill.toLowerCase().includes(us)
        )
    );

    return {
        ...job,
        matchPercentage: totalScore,
        matchedRequired: requiredMatches,
        matchedPreferred: preferredMatches,
        missingRequired,
        missingPreferred,
        totalMatched: requiredMatches.length + preferredMatches.length,
        totalSkillsNeeded: job.requiredSkills.length + job.preferredSkills.length
    };
};

/**
 * Get job recommendations based on user skills
 * @param {string[]} userSkills - Array of user's skills
 * @param {Object} options - Optional filters
 * @returns {Object[]} - Sorted array of job matches
 */
export const getJobRecommendations = (userSkills, options = {}) => {
    if (!userSkills || userSkills.length === 0) {
        return [];
    }

    let jobs = [...JOB_DATABASE];

    // Filter by experience level if provided
    if (options.experienceLevel) {
        jobs = jobs.filter(job => job.experienceLevel === options.experienceLevel);
    }

    // Filter by industry if provided
    if (options.industry) {
        jobs = jobs.filter(job =>
            job.industry.toLowerCase().includes(options.industry.toLowerCase())
        );
    }

    // Calculate match for each job
    const matchedJobs = jobs.map(job => calculateMatch(userSkills, job));

    // Sort by match percentage (highest first)
    matchedJobs.sort((a, b) => b.matchPercentage - a.matchPercentage);

    // Return top matches (at least 20% match)
    const topMatches = matchedJobs.filter(job => job.matchPercentage >= 20);

    // Always return at least 3 results, even if low match
    if (topMatches.length < 3) {
        return matchedJobs.slice(0, Math.max(5, matchedJobs.length));
    }

    return topMatches.slice(0, 10); // Max 10 recommendations
};

/**
 * Generate skill gap analysis
 * @param {string[]} userSkills
 * @param {Object} topJob - The top matched job
 * @returns {Object[]} - Skill gap items with status
 */
export const generateSkillGap = (userSkills, topJobs) => {
    if (!topJobs || topJobs.length === 0) return [];

    const normalizedUserSkills = userSkills.map(s => s.toLowerCase());

    // Collect all unique skills from top 3 jobs
    const allRequiredSkills = new Set();
    topJobs.slice(0, 3).forEach(job => {
        job.requiredSkills.forEach(s => allRequiredSkills.add(s));
        job.preferredSkills.forEach(s => allRequiredSkills.add(s));
    });

    const skillGap = [];
    allRequiredSkills.forEach(skill => {
        const hasSkill = normalizedUserSkills.some(us =>
            us.includes(skill.toLowerCase()) || skill.toLowerCase().includes(us)
        );

        // Count how many top jobs need this skill
        const jobCount = topJobs.slice(0, 3).filter(job =>
            [...job.requiredSkills, ...job.preferredSkills]
                .some(s => s.toLowerCase() === skill.toLowerCase())
        ).length;

        const importance = jobCount >= 3 ? 'critical' : jobCount >= 2 ? 'important' : 'nice-to-have';

        skillGap.push({
            skill,
            hasSkill,
            importance,
            percentage: hasSkill ? (90 + Math.floor(Math.random() * 10)) : Math.floor(Math.random() * 40 + 20),
            status: hasSkill ? 'Strong' : importance === 'critical' ? 'Gap Identified' : 'Needs Improvement'
        });
    });

    // Sort: matched skills first, then by importance
    skillGap.sort((a, b) => {
        if (a.hasSkill !== b.hasSkill) return b.hasSkill - a.hasSkill;
        const importanceOrder = { critical: 0, important: 1, 'nice-to-have': 2 };
        return importanceOrder[a.importance] - importanceOrder[b.importance];
    });

    return skillGap.slice(0, 8); // Top 8 skills for display
};
