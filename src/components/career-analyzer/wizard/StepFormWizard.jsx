import React, { useState, useEffect } from 'react';
import ProgressBar from '../common/ProgressBar';
import Button from '../common/Button';
import { useAuth } from '../../../contexts/AuthContext';

import Step1Profile from './Step1Profile';
import Step2Skills from './Step2Skills';
import Step3Preferences from './Step3Preferences';
import Step4Experience from './Step4Experience';
import Step5AIQuestions from './Step5AIQuestions';
import Step6ResultsDashboard from './Step6ResultsDashboard';

const initialFormData = {
  fullName: '',
  email: '',
  phone: '',
  location: '',
  qualification: '',
  fieldOfStudy: '',
  experienceType: 'fresher',

  skills: [],
  skillLevel: 'Beginner',
  tools: '',

  preferredRole: '',
  industry: '',
  jobTypes: [],
  expectedSalary: 50000,
  relocation: false,

  yearsExperience: '',
  lastJobTitle: '',
  companyName: '',
  responsibilities: '',
  projects: '',

  enjoyWork: '',
  workStyle: '',
  careerGoal: '',
  learningInterest: '',
  resume: null, // Added resume field
  resumeText: '', // Extracted text from resume
};

const StepFormWizard = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(initialFormData);
  const { userData } = useAuth();

  useEffect(() => {
    if (userData) {
      setFormData(prev => ({
        ...prev,
        fullName: prev.fullName || userData.name || '',
        email: prev.email || userData.email || '',
        phone: prev.phone || userData.phone || ''
      }));
    }
  }, [userData]);

  const UPDATE_FORM = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep === 1 && formData.experienceType === 'fresher') {
      setCurrentStep(2);
      return;
    }

    // Validate Step 2 (Skills) - Resume Upload Mandatory
    if (currentStep === 2 && !formData.resume) {
      alert("Please upload your resume to proceed.");
      return;
    }

    if (currentStep === 3 && formData.experienceType === 'fresher') {
      setCurrentStep(5);
      return;
    }
    setCurrentStep(prev => prev + 1);
  };

  const prevStep = () => {
    if (currentStep === 5 && formData.experienceType === 'fresher') {
      setCurrentStep(3);
      return;
    }
    setCurrentStep(prev => prev - 1);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1: return <Step1Profile formData={formData} setFormData={UPDATE_FORM} />;
      case 2: return <Step2Skills formData={formData} setFormData={UPDATE_FORM} />;
      case 3: return <Step3Preferences formData={formData} setFormData={UPDATE_FORM} />;
      case 4: return <Step4Experience formData={formData} setFormData={UPDATE_FORM} />;
      case 5: return <Step5AIQuestions formData={formData} setFormData={UPDATE_FORM} />;
      case 6: return <Step6ResultsDashboard formData={formData} />;
      default: return null;
    }
  };

  // Using new card style
  const wizardStyle = {
    backgroundColor: 'var(--surface)',
    borderRadius: '1.5rem', // Larger radius for modern feel
    boxShadow: 'var(--shadow-lg)',
    border: '1px solid var(--border)',
    overflow: 'hidden',
    transition: 'all 0.3s',
    position: 'relative'
  };

  const contentStyle = {
    padding: '2rem'
  };

  const footerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '3rem',
    paddingTop: '1.5rem',
    borderTop: '1px solid var(--bg-light)'
  };

  return (
    <div style={wizardStyle}>
      <div style={contentStyle}>
        <ProgressBar currentStep={currentStep} totalSteps={6} />

        <div style={{ minHeight: '400px', padding: '1rem 0' }}>
          {renderStep()}
        </div>

        <div style={footerStyle}>
          {currentStep > 1 && currentStep < 6 && (
            <Button
              variant="secondary"
              onClick={prevStep}
            >
              ← Back
            </Button>
          )}

          {/* Spacer */}
          {currentStep === 1 && <div></div>}

          {currentStep < 6 && (
            <Button
              variant="primary"
              onClick={nextStep}
              style={{ marginLeft: 'auto' }}
            >
              {currentStep === 5 ? 'Analyze Profile' : 'Next Step'} →
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StepFormWizard;
