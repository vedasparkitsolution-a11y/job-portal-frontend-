import React from 'react';
import Button from '../common/Button';

const RecommendationCard = ({ job, onApply, onViewDetails }) => {
    // Support both old props (role, matchPercentage, salary, reason) and new job object
    const title = job?.title || '';
    const matchPercentage = job?.matchPercentage || 0;
    const salary = job?.salaryRange || '';
    const reason = job?.description || '';
    const companyType = job?.companyType || '';
    const matchedSkills = job?.matchedRequired || [];

    const cardStyle = {
        backgroundColor: 'var(--surface)',
        padding: '1.5rem',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'default',
        position: 'relative',
        overflow: 'hidden'
    };

    const headerStyle = {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '1rem'
    };

    const roleStyle = {
        fontSize: '1.125rem',
        fontWeight: '700',
        color: 'var(--text-dark)',
        letterSpacing: '-0.01em'
    };

    const salaryStyle = {
        fontSize: '0.875rem',
        color: 'var(--text-medium)',
        fontWeight: '500',
        marginTop: '0.2rem'
    };

    const getMatchColor = (pct) => {
        if (pct >= 80) return { bg: 'rgba(16, 185, 129, 0.1)', color: '#059669', border: 'rgba(16, 185, 129, 0.2)' };
        if (pct >= 60) return { bg: 'rgba(245, 158, 11, 0.1)', color: '#d97706', border: 'rgba(245, 158, 11, 0.2)' };
        return { bg: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', border: 'rgba(99, 102, 241, 0.2)' };
    };

    const matchColors = getMatchColor(matchPercentage);

    const matchBadgeStyle = {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem',
        backgroundColor: matchColors.bg,
        color: matchColors.color,
        padding: '0.25rem 0.75rem',
        borderRadius: '2rem',
        fontSize: '0.75rem',
        fontWeight: '700',
        border: `1px solid ${matchColors.border}`
    };

    const reasonStyle = {
        color: 'var(--text-medium)',
        fontSize: '0.875rem',
        lineHeight: '1.6',
        marginBottom: '1rem'
    };

    const skillTagStyle = {
        display: 'inline-block',
        backgroundColor: 'rgba(79, 70, 229, 0.08)',
        color: 'var(--primary)',
        padding: '0.15rem 0.5rem',
        borderRadius: '1rem',
        fontSize: '0.7rem',
        fontWeight: '500',
        margin: '0.1rem'
    };

    const actionContainerStyle = {
        display: 'flex',
        gap: '0.75rem'
    };

    return (
        <div
            style={cardStyle}
            className="hover:shadow-lg hover:-translate-y-1"
        >
            <div style={headerStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                        padding: '0.75rem',
                        backgroundColor: 'var(--primary-light)',
                        borderRadius: '0.75rem',
                        color: 'var(--primary)',
                        fontSize: '1.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        💼
                    </div>
                    <div>
                        <h3 style={roleStyle}>{title}</h3>
                        <div style={salaryStyle}>{salary} • {companyType}</div>
                    </div>
                </div>
                <div style={matchBadgeStyle}>
                    ✓ {matchPercentage}% Match
                </div>
            </div>

            <p style={reasonStyle}>
                {reason}
            </p>

            {/* Matched Skills Tags */}
            {matchedSkills.length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                    {matchedSkills.slice(0, 5).map((skill, i) => (
                        <span key={i} style={skillTagStyle}>{skill}</span>
                    ))}
                    {matchedSkills.length > 5 && (
                        <span style={{ ...skillTagStyle, backgroundColor: 'var(--bg-light)', color: 'var(--text-medium)' }}>
                            +{matchedSkills.length - 5} more
                        </span>
                    )}
                </div>
            )}

            <div style={actionContainerStyle}>
                <Button
                    variant="outline"
                    style={{ flex: 1 }}
                    onClick={() => onViewDetails && onViewDetails(job)}
                >
                    View Details
                </Button>
                <Button
                    style={{ flex: 1 }}
                    onClick={() => onApply && onApply(job)}
                >
                    Apply Now
                </Button>
            </div>
        </div>
    );
};

export default RecommendationCard;
