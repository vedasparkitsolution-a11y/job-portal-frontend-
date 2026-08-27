import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { FiGlobe, FiChevronDown, FiCheck } from 'react-icons/fi';

export default function LanguageSwitcher({ style = {}, compact = false }) {
    const { language, setLanguage, supportedLanguages, currentLanguageInfo } = useLanguage();
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

    return (
        <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block', ...style }}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    background: '#f8fafc',
                    color: '#1e293b',
                    border: '1px solid #cbd5e1',
                    borderRadius: '10px',
                    padding: compact ? '6px 10px' : '8px 14px',
                    fontSize: compact ? '0.82rem' : '0.88rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#0ea5e9'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#cbd5e1'}
            >
                <span style={{ fontSize: '1rem' }}>{currentLanguageInfo.flag}</span>
                <span>{compact ? currentLanguageInfo.name : currentLanguageInfo.nativeName}</span>
                <FiChevronDown size={14} style={{ color: '#64748b', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    right: 0,
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
                    minWidth: '180px',
                    zIndex: 1050,
                    padding: '6px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px'
                }}>
                    <div style={{ padding: '6px 10px', fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Select Language
                    </div>
                    {supportedLanguages.map((lang) => {
                        const isSelected = language === lang.code;
                        return (
                            <button
                                key={lang.code}
                                type="button"
                                onClick={() => {
                                    setLanguage(lang.code);
                                    setIsOpen(false);
                                }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    width: '100%',
                                    padding: '8px 10px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: isSelected ? '#eff6ff' : 'transparent',
                                    color: isSelected ? '#0284c7' : '#334155',
                                    fontWeight: isSelected ? 800 : 600,
                                    fontSize: '0.86rem',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    transition: 'background 0.1s'
                                }}
                                onMouseEnter={e => {
                                    if (!isSelected) e.currentTarget.style.background = '#f8fafc';
                                }}
                                onMouseLeave={e => {
                                    if (!isSelected) e.currentTarget.style.background = 'transparent';
                                }}
                            >
                                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '1.1rem' }}>{lang.flag}</span>
                                    <span>{lang.nativeName}</span>
                                </span>
                                {isSelected && <FiCheck size={14} color="#0284c7" strokeWidth={3} />}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
