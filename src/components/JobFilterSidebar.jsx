import { useState } from 'react';
import { FiChevronUp, FiChevronDown, FiRotateCcw, FiFilter, FiBriefcase, FiUserCheck, FiDollarSign, FiClock, FiBookOpen, FiMapPin } from 'react-icons/fi';

export default function JobFilterSidebar({ filters, onFilterChange, onClearAll, activeFilterCount }) {
    const [collapsedSections, setCollapsedSections] = useState({
        level: false,
        jobType: false,
        workMode: false,
        salary: false,
        datePosted: false,
        education: false
    });

    const toggleSection = (section) => {
        setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const filterSections = [
        {
            id: 'level',
            title: 'Candidate Level',
            icon: <FiUserCheck style={{ color: '#0ea5e9' }} />,
            key: 'level',
            options: [
                { label: 'All Candidates', value: '' },
                { label: 'College Student / Intern', value: 'student' },
                { label: 'Fresher (0 - 1 Years)', value: 'fresher' },
                { label: 'Experienced (1 - 3 Years)', value: 'experienced' },
                { label: 'Senior (3+ Years)', value: 'senior' },
            ]
        },
        {
            id: 'jobType',
            title: 'Job Type',
            icon: <FiBriefcase style={{ color: '#0ea5e9' }} />,
            key: 'jobType',
            options: [
                { label: 'All Types', value: '' },
                { label: 'Full-Time', value: 'Full-Time' },
                { label: 'Part-Time', value: 'Part-Time' },
                { label: 'Internship', value: 'Internship' },
                { label: 'Contract', value: 'Contract' },
            ]
        },
        {
            id: 'workMode',
            title: 'Work Mode',
            icon: <FiMapPin style={{ color: '#0ea5e9' }} />,
            key: 'workMode',
            options: [
                { label: 'All Modes', value: '' },
                { label: 'Work From Home / Remote', value: 'Remote' },
                { label: 'On-Site', value: 'Onsite' },
                { label: 'Hybrid', value: 'Hybrid' },
            ]
        },
        {
            id: 'salary',
            title: 'Salary & Package',
            icon: <FiDollarSign style={{ color: '#0ea5e9' }} />,
            key: 'salary',
            options: [
                { label: 'Any Salary', value: '' },
                { label: 'Up to ₹3 L / Year (Stipend)', value: 'up_to_3l' },
                { label: '₹3 Lakhs - ₹6 Lakhs / Year', value: '3l_6l' },
                { label: '₹6 Lakhs - ₹12 Lakhs / Year', value: '6l_12l' },
                { label: 'Above ₹12 Lakhs / Year', value: 'above_12l' },
            ]
        },
        {
            id: 'datePosted',
            title: 'Date Posted',
            icon: <FiClock style={{ color: '#0ea5e9' }} />,
            key: 'datePosted',
            options: [
                { label: 'All Days', value: '' },
                { label: 'Past 24 Hours', value: '1' },
                { label: 'Past 3 Days', value: '3' },
                { label: 'Past 7 Days', value: '7' },
                { label: 'Past 30 Days', value: '30' },
            ]
        },
        {
            id: 'education',
            title: 'Education',
            icon: <FiBookOpen style={{ color: '#0ea5e9' }} />,
            key: 'education',
            options: [
                { label: 'Any Education', value: '' },
                { label: "B.E. / B.Tech / CS", value: "Bachelor's" },
                { label: "Degree / Any Graduate", value: "Graduate" },
                { label: "Diploma / 12th Pass", value: "Diploma" },
                { label: "Master's / MBA", value: "Master's" },
            ]
        }
    ];

    return (
        <aside className="job-filter-sidebar">
            <div className="filter-sidebar-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FiFilter style={{ color: '#0ea5e9', fontSize: '1.2rem' }} />
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>Filters</h3>
                    {activeFilterCount > 0 && (
                        <span className="filter-badge">{activeFilterCount}</span>
                    )}
                </div>
                {activeFilterCount > 0 && (
                    <button onClick={onClearAll} className="clear-filters-btn">
                        <FiRotateCcw size={13} /> Reset
                    </button>
                )}
            </div>

            <div className="filter-sections-list">
                {filterSections.map((sec) => {
                    const isCollapsed = collapsedSections[sec.id];
                    const currentValue = filters[sec.key] || '';

                    return (
                        <div key={sec.id} className="filter-section-item">
                            <div className="filter-section-title" onClick={() => toggleSection(sec.id)}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    {sec.icon}
                                    <span>{sec.title}</span>
                                </div>
                                {isCollapsed ? <FiChevronDown size={16} /> : <FiChevronUp size={16} />}
                            </div>

                            {!isCollapsed && (
                                <div className="filter-options-group">
                                    {sec.options.map((opt) => {
                                        const isSelected = currentValue === opt.value;
                                        return (
                                            <label
                                                key={opt.value}
                                                className={`filter-radio-option ${isSelected ? 'selected' : ''}`}
                                            >
                                                <input
                                                    type="radio"
                                                    name={sec.key}
                                                    value={opt.value}
                                                    checked={isSelected}
                                                    onChange={() => onFilterChange(sec.key, opt.value)}
                                                />
                                                <span className="custom-radio-circle"></span>
                                                <span className="radio-label-text">{opt.label}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </aside>
    );
}
