import React from 'react';

const ProgressBar = ({ currentStep, totalSteps = 6 }) => {
    const progress = ((currentStep - 1) / (totalSteps - 1)) * 100;

    const steps = [
        { label: 'Profile' },
        { label: 'Skills' },
        { label: 'Preferences' },
        { label: 'Experience' },
        { label: 'Analysis' },
        { label: 'Results' },
    ];

    return (
        <div style={{ marginBottom: '2rem' }}>
            {/* Step Indicators */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                {steps.map((step, index) => {
                    const stepNum = index + 1;
                    const isActive = stepNum <= currentStep;

                    return (
                        <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div
                                style={{
                                    width: '2rem',
                                    height: '2rem',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.875rem',
                                    fontWeight: 'bold',
                                    backgroundColor: isActive ? 'var(--primary)' : 'var(--white)',
                                    color: isActive ? 'var(--white)' : 'var(--text-light)',
                                    border: isActive ? '2px solid var(--primary)' : '2px solid var(--border)',
                                    transition: 'all 0.3s'
                                }}
                            >
                                {stepNum}
                            </div>
                            <span className="step-label" style={{
                                fontSize: '0.75rem',
                                marginTop: '0.5rem',
                                fontWeight: '500',
                                color: isActive ? 'var(--primary)' : 'var(--text-light)'
                            }}>
                                {step.label}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Progress Line */}
            <div style={{ height: '0.5rem', backgroundColor: 'var(--border)', borderRadius: '99px', overflow: 'hidden' }}>
                <div
                    style={{
                        height: '100%',
                        width: `${progress}%`,
                        backgroundColor: 'var(--primary)',
                        transition: 'width 0.5s ease-out'
                    }}
                />
            </div>
        </div>
    );
};

export default ProgressBar;
