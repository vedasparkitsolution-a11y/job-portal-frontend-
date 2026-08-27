/**
 * Candidate - Job Match Score Calculator
 * Evaluates candidate profile against job requirements.
 * Weights:
 * - Skills Match: 40%
 * - Experience Match: 25%
 * - Education Match: 15%
 * - Location Match: 10%
 * - Other / CGPA Match: 10%
 */

export function calculateMatchScore(candidate = {}, job = {}) {
    let skillsScore = 0;
    let expScore = 0;
    let eduScore = 0;
    let locScore = 0;
    let otherScore = 0;

    // 1. Skills Match (40%)
    const jobSkills = (job.skills || '').toLowerCase().split(/[,\s]+/).filter(Boolean);
    const candidateSkillsStr = [
        candidate.skills || '',
        candidate.department || '',
        ...(candidate.education || []).map(e => `${e.title} ${e.institution}`),
        ...(candidate.projects || []).map(p => `${p.title} ${p.description}`)
    ].join(' ').toLowerCase();

    if (jobSkills.length > 0) {
        const matched = jobSkills.filter(s => candidateSkillsStr.includes(s));
        skillsScore = Math.min(40, Math.round((matched.length / jobSkills.length) * 40));
    } else {
        skillsScore = 30; // default if no job skills specified
    }

    // 2. Experience Match (25%)
    const reqExp = (job.experience || '').toLowerCase();
    const candidateExpCount = (candidate.internships || []).length + (candidate.employment || []).length;

    if (reqExp.includes('fresher') || reqExp.includes('0')) {
        expScore = 25;
    } else if (reqExp.includes('1-2') || reqExp.includes('1')) {
        expScore = candidateExpCount >= 1 ? 25 : 15;
    } else if (reqExp.includes('3-5') || reqExp.includes('3')) {
        expScore = candidateExpCount >= 2 ? 25 : candidateExpCount === 1 ? 18 : 10;
    } else if (reqExp.includes('5+')) {
        expScore = candidateExpCount >= 3 ? 25 : 15;
    } else {
        expScore = candidateExpCount > 0 ? 25 : 18;
    }

    // 3. Education Match (15%)
    const reqEdu = (job.education || job.qualification || '').toLowerCase();
    const candidateEduStr = [
        candidate.department || '',
        ...(candidate.education || []).map(e => e.title)
    ].join(' ').toLowerCase();

    if (!reqEdu || reqEdu.includes('any')) {
        eduScore = 15;
    } else if (candidateEduStr.includes(reqEdu) || candidateEduStr.includes('b.tech') || candidateEduStr.includes('bachelor') || candidateEduStr.includes('degree')) {
        eduScore = 15;
    } else {
        eduScore = 10;
    }

    // 4. Location Match (10%)
    const jobLoc = (job.location || '').toLowerCase();
    const candidateLoc = (candidate.address || candidate.preferences?.preferredLocation || '').toLowerCase();

    if (!jobLoc || jobLoc.includes('remote') || candidateLoc.includes('remote')) {
        locScore = 10;
    } else if (candidateLoc.includes(jobLoc) || jobLoc.includes(candidateLoc)) {
        locScore = 10;
    } else {
        locScore = 5;
    }

    // 5. Other / CGPA Match (10%)
    if (candidate.resumeURL) otherScore += 5;
    if (candidate.cgpa || candidate.summaryText) otherScore += 5;

    const totalScore = Math.min(100, Math.max(50, skillsScore + expScore + eduScore + locScore + otherScore));

    let level = 'Low Match';
    let levelClass = 'low';

    if (totalScore >= 90) {
        level = 'Excellent Match';
        levelClass = 'excellent';
    } else if (totalScore >= 75) {
        level = 'Good Match';
        levelClass = 'good';
    } else if (totalScore >= 60) {
        level = 'Moderate Match';
        levelClass = 'moderate';
    }

    return {
        score: totalScore,
        level,
        levelClass,
        breakdown: {
            skills: skillsScore,
            experience: expScore,
            education: eduScore,
            location: locScore,
            other: otherScore
        }
    };
}
