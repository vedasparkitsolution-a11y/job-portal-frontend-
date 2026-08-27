import React from 'react';

const Button = ({ children, onClick, variant = 'primary', className = '', type = 'button', disabled = false }) => {
    const baseStyle = {
        padding: '0.75rem 1.5rem',
        borderRadius: 'var(--radius)',
        fontWeight: '600',
        fontSize: '0.95rem',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        opacity: disabled ? 0.6 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        position: 'relative',
        overflow: 'hidden'
    };

    const variants = {
        primary: {
            backgroundColor: 'var(--primary)',
            color: '#ffffff',
            border: 'none',
            boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.4)' // Matches new indigo theme
        },
        secondary: {
            backgroundColor: 'var(--surface)',
            color: 'var(--text-dark)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-sm)'
        },
        outline: {
            backgroundColor: 'transparent',
            border: '2px solid var(--primary)',
            color: 'var(--primary)'
        },
        danger: {
            backgroundColor: 'var(--danger)',
            color: '#ffffff',
            boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.4)'
        }
    };

    const style = { ...baseStyle, ...variants[variant] };

    return (
        <button
            type={type}
            style={style}
            className={className}
            onClick={onClick}
            disabled={disabled}
            onMouseOver={(e) => {
                if (!disabled) {
                    if (variant === 'primary') e.currentTarget.style.backgroundColor = 'var(--primary-hover)';
                    if (variant === 'secondary') e.currentTarget.style.borderColor = 'var(--text-light)';
                    if (variant === 'outline') e.currentTarget.style.backgroundColor = 'var(--primary-light)';
                }
            }}
            onMouseOut={(e) => {
                if (!disabled) {
                    if (variant === 'primary') e.currentTarget.style.backgroundColor = 'var(--primary)';
                    if (variant === 'secondary') e.currentTarget.style.borderColor = 'var(--border)';
                    if (variant === 'outline') e.currentTarget.style.backgroundColor = 'transparent';
                }
            }}
        >
            {children}
        </button>
    );
};

export default Button;
