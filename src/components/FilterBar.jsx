import { FiSearch, FiMapPin, FiBriefcase, FiAward, FiChevronDown } from 'react-icons/fi';
import { useState, useRef, useEffect } from 'react';

function CustomDropdown({ icon: Icon, value, onChange, options, placeholder }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(opt => opt.value === value) || { label: placeholder, value: '' };

    return (
        <div className="filter-group custom-dropdown" ref={dropdownRef} style={{ position: 'relative', cursor: 'pointer' }}>
            <Icon className="filter-icon" style={{ left: '16px', zIndex: 1 }} />
            <div 
                className="dropdown-trigger"
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    width: '100%',
                    padding: '12px 16px 12px 42px',
                    fontFamily: 'var(--font)',
                    fontSize: '0.95rem',
                    color: value ? 'var(--text-primary)' : 'var(--text-secondary)',
                    background: 'var(--bg-light)',
                    border: isOpen ? '2px solid var(--primary)' : '1.5px solid var(--border)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.2s',
                    boxShadow: isOpen ? '0 0 0 4px var(--primary-glow)' : 'none'
                }}
            >
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {selectedOption.label}
                </span>
                <FiChevronDown style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', color: 'var(--text-muted)' }} />
            </div>
            
            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    left: 0,
                    right: 0,
                    background: 'white',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                    zIndex: 100,
                    maxHeight: '220px',
                    overflowY: 'auto',
                    padding: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                }}>
                    <div
                        onClick={() => { onChange(''); setIsOpen(false); }}
                        style={{
                            padding: '10px 16px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            background: value === '' ? 'var(--primary-50)' : 'transparent',
                            color: value === '' ? 'var(--primary)' : 'var(--text-primary)',
                            fontWeight: value === '' ? 600 : 500,
                            transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = value === '' ? 'var(--primary-50)' : '#f8fafc'}
                        onMouseLeave={e => e.currentTarget.style.background = value === '' ? 'var(--primary-50)' : 'transparent'}
                    >
                        {placeholder}
                    </div>
                    {options.map((opt) => (
                        <div
                            key={opt.value}
                            onClick={() => { onChange(opt.value); setIsOpen(false); }}
                            style={{
                                padding: '10px 16px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                background: value === opt.value ? 'var(--primary-50)' : 'transparent',
                                color: value === opt.value ? 'var(--primary)' : 'var(--text-primary)',
                                fontWeight: value === opt.value ? 600 : 500,
                                transition: 'all 0.15s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = value === opt.value ? 'var(--primary-50)' : '#f8fafc'}
                            onMouseLeave={e => e.currentTarget.style.background = value === opt.value ? 'var(--primary-50)' : 'transparent'}
                        >
                            {opt.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function FilterBar({ filters, onFilterChange, onSearch }) {
    return (
        <div className="filter-bar" style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', padding: '20px', background: 'white', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: '1px solid var(--border)' }}>
            <div className="filter-group" style={{ position: 'relative', flex: '1 1 200px' }}>
                <FiSearch className="filter-icon" style={{ left: '16px', top: '50%', transform: 'translateY(-50%)', position: 'absolute', color: 'var(--text-muted)' }} />
                <input
                    type="text"
                    placeholder="Job title or keyword..."
                    value={filters.keyword}
                    onChange={e => onFilterChange('keyword', e.target.value)}
                />
            </div>
            <div className="filter-group">
                <FiMapPin className="filter-icon" />
                <input
                    type="text"
                    placeholder="Location..."
                    value={filters.location}
                    onChange={e => onFilterChange('location', e.target.value)}
                />
            </div>
            <div className="filter-group">
                <FiBriefcase className="filter-icon" />
                <select
                    value={filters.jobType}
                    onChange={e => onFilterChange('jobType', e.target.value)}
                >
                    <option value="">All Types</option>
                    <option value="Full-Time">Full-Time</option>
                    <option value="Part-Time">Part-Time</option>
                    <option value="Internship">Internship</option>
                </select>
                <FiChevronDown className="select-arrow" />
            </div>
            <div className="filter-group">
                <FiAward className="filter-icon" />
                <select
                    value={filters.experience}
                    onChange={e => onFilterChange('experience', e.target.value)}
                >
                    <option value="">Any Experience</option>
                    <option value="Fresher">Fresher</option>
                    <option value="1-2 years">1-2 years</option>
                    <option value="3-5 years">3-5 years</option>
                    <option value="5+ years">5+ years</option>
                </select>
                <FiChevronDown className="select-arrow" />
            </div>
            <button className="btn btn-primary" onClick={onSearch}>
                <FiSearch /> Search
            </button>
        </div>
    );
}
