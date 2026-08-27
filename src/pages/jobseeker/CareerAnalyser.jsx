import React from 'react';
import CandidateSidebar from '../../components/CandidateSidebar';
import StepFormWizard from '../../components/career-analyzer/wizard/StepFormWizard';
import '../../index.css';

export default function CareerAnalyser() {
    return (
        <CandidateSidebar>
            <div style={{
                maxWidth: '1000px',
                margin: '0 auto',
                padding: '1rem',
                position: 'relative',
                zIndex: 1
            }} className="animate-slideUp">
                <StepFormWizard />
            </div>
        </CandidateSidebar>
    );
}
