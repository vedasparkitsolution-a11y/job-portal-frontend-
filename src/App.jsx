import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { ToastProvider } from './components/Toast';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSpinner from './components/LoadingSpinner';
import CompanyLayout from './components/company/CompanyLayout';
import AdminLayout from './components/admin/AdminLayout';

// Public Pages
import Home from './pages/Home';
import Login from './pages/Login';
import RegisterJobSeeker from './pages/RegisterJobSeeker';
import RegisterCompany from './pages/RegisterCompany';
import BrowseJobs from './pages/BrowseJobs';
import JobDetails from './pages/JobDetails';
import Blog from './pages/Blog';
import DashboardSelection from './pages/DashboardSelection';

// Job Seeker Pages
import JobSeekerDashboard from './pages/jobseeker/JobSeekerDashboard';
import JobSeekerProfile from './pages/jobseeker/JobSeekerProfile';
import MyApplications from './pages/jobseeker/MyApplications';
import ApplyJob from './pages/jobseeker/ApplyJob';
import ResumeUpload from './pages/jobseeker/ResumeUpload';
import Messages from './pages/jobseeker/Messages';
import JobAlerts from './pages/jobseeker/JobAlerts';
import SavedJobs from './pages/jobseeker/SavedJobs';
import AccountSettings from './pages/jobseeker/AccountSettings';
import AvailableAssessments from './pages/jobseeker/AvailableAssessments';
import TakeAssessment from './pages/jobseeker/TakeAssessment';
import CareerAnalyser from './pages/jobseeker/CareerAnalyser';
import CreateCandidateProfile from './pages/jobseeker/CreateCandidateProfile';
import RecommendedJobs from './pages/jobseeker/RecommendedJobs';
import CandidateSubscriptions from './pages/jobseeker/CandidateSubscriptions';

// Company Pages
import CompanyDashboard from './pages/company/CompanyDashboard';
import PostJob from './pages/company/PostJob';
import ManageJobs from './pages/company/ManageJobs';
import ViewApplicants from './pages/company/ViewApplicants';
import CompanyProfile from './pages/company/CompanyProfile';
import CompanyMessages from './pages/company/CompanyMessages';
import CompanyAnalytics from './pages/company/CompanyAnalytics';
import CompanySettings from './pages/company/CompanySettings';
import InterviewScheduler from './pages/company/InterviewScheduler';

import AssessmentsDashboard from './pages/company/AssessmentsDashboard';
import CreateAssessment from './pages/company/CreateAssessment';
import AssessmentResults from './pages/company/AssessmentResults';

import CandidateMatches from './pages/company/CandidateMatches';
import SubscriptionPlans from './pages/company/SubscriptionPlans';
import PaymentSuccess from './pages/company/PaymentSuccess';
import PaymentFailed from './pages/company/PaymentFailed';
import PaymentHistory from './pages/company/PaymentHistory';
import HiringPipeline from './pages/company/HiringPipeline';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageCompanies from './pages/admin/ManageCompanies';
import ManageAllJobs from './pages/admin/ManageAllJobs';
import ManageUsers from './pages/admin/ManageUsers';
import ManageApplications from './pages/admin/ManageApplications';
import AdminPostJob from './pages/admin/AdminPostJob';
import AdminAddCompany from './pages/admin/AdminAddCompany';
import JobApprovals from './pages/admin/JobApprovals';
import AdminPremiumPlans from './pages/admin/AdminPremiumPlans';
import AdminReports from './pages/admin/AdminReports';
import AdminNotifications from './pages/admin/AdminNotifications';
import AdminSettings from './pages/admin/AdminSettings';
import AdminPayments from './pages/admin/AdminPayments';

import Pricing from './pages/Pricing';

import CreateCompanyProfile from './pages/company/CreateCompanyProfile';

function App() {
    const { loading } = useAuth();

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <ToastProvider>
            <Routes>
                {/* Routes with standard top-navbar layout */}
                <Route element={<Layout><Outlet /></Layout>}>
                    {/* Public Routes */}
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register/jobseeker" element={<RegisterJobSeeker />} />
                    <Route path="/register/company" element={<RegisterCompany />} />
                    <Route path="/company/create-profile" element={<CreateCompanyProfile />} />
                    <Route path="/candidate/create-profile" element={<CreateCandidateProfile />} />
                    <Route path="/jobs" element={<BrowseJobs />} />


                    <Route path="/pricing" element={<Pricing />} />
                    <Route path="/jobs/:id" element={<JobDetails />} />
                    <Route path="/blog" element={<Blog />} />
                    <Route path="/dashboard" element={<DashboardSelection />} />

                </Route>

                {/* Dashboard-style routes for Job Seeker / Candidate */}
                <Route path="/jobs/:id/apply" element={<ProtectedRoute allowedRoles={['jobseeker']}><ApplyJob /></ProtectedRoute>} />
                <Route path="/jobseeker" element={<ProtectedRoute allowedRoles={['jobseeker']}><JobSeekerDashboard /></ProtectedRoute>} />
                <Route path="/jobseeker/profile" element={<ProtectedRoute allowedRoles={['jobseeker']}><JobSeekerProfile /></ProtectedRoute>} />
                <Route path="/jobseeker/applications" element={<ProtectedRoute allowedRoles={['jobseeker']}><MyApplications /></ProtectedRoute>} />
                <Route path="/jobseeker/assessments" element={<ProtectedRoute allowedRoles={['jobseeker']}><AvailableAssessments /></ProtectedRoute>} />
                <Route path="/jobseeker/assessments/take/:id" element={<ProtectedRoute allowedRoles={['jobseeker']}><TakeAssessment /></ProtectedRoute>} />
                <Route path="/jobseeker/resume" element={<ProtectedRoute allowedRoles={['jobseeker']}><ResumeUpload /></ProtectedRoute>} />
                <Route path="/jobseeker/messages" element={<ProtectedRoute allowedRoles={['jobseeker']}><Messages /></ProtectedRoute>} />
                <Route path="/jobseeker/job-alerts" element={<ProtectedRoute allowedRoles={['jobseeker']}><JobAlerts /></ProtectedRoute>} />
                <Route path="/jobseeker/saved-jobs" element={<ProtectedRoute allowedRoles={['jobseeker']}><SavedJobs /></ProtectedRoute>} />
                <Route path="/jobseeker/recommended-jobs" element={<ProtectedRoute allowedRoles={['jobseeker']}><RecommendedJobs /></ProtectedRoute>} />
                <Route path="/jobseeker/subscriptions" element={<ProtectedRoute allowedRoles={['jobseeker']}><CandidateSubscriptions /></ProtectedRoute>} />
                <Route path="/jobseeker/settings" element={<ProtectedRoute allowedRoles={['jobseeker']}><AccountSettings /></ProtectedRoute>} />
                <Route path="/candidate/analyze-career" element={<ProtectedRoute allowedRoles={['jobseeker']}><CareerAnalyser /></ProtectedRoute>} />

                {/* Dashboard-style routes for Admin */}
                <Route element={<AdminLayout><Outlet /></AdminLayout>}>
                    <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
                    <Route path="/admin/companies" element={<ProtectedRoute allowedRoles={['admin']}><ManageCompanies /></ProtectedRoute>} />
                    <Route path="/admin/jobs" element={<ProtectedRoute allowedRoles={['admin']}><ManageAllJobs /></ProtectedRoute>} />
                    <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><ManageUsers /></ProtectedRoute>} />
                    <Route path="/admin/applications" element={<ProtectedRoute allowedRoles={['admin']}><ManageApplications /></ProtectedRoute>} />
                    <Route path="/admin/post-job" element={<ProtectedRoute allowedRoles={['admin']}><AdminPostJob /></ProtectedRoute>} />
                    <Route path="/admin/add-company" element={<ProtectedRoute allowedRoles={['admin']}><AdminAddCompany /></ProtectedRoute>} />
                    <Route path="/admin/approvals" element={<ProtectedRoute allowedRoles={['admin']}><JobApprovals /></ProtectedRoute>} />
                    <Route path="/admin/premium-plans" element={<ProtectedRoute allowedRoles={['admin']}><AdminPremiumPlans /></ProtectedRoute>} />
                    <Route path="/admin/payments" element={<ProtectedRoute allowedRoles={['admin']}><AdminPayments /></ProtectedRoute>} />
                    <Route path="/admin/reports" element={<ProtectedRoute allowedRoles={['admin']}><AdminReports /></ProtectedRoute>} />
                    <Route path="/admin/notifications" element={<ProtectedRoute allowedRoles={['admin']}><AdminNotifications /></ProtectedRoute>} />
                    <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['admin']}><AdminSettings /></ProtectedRoute>} />
                </Route>

                {/* Dashboard-style routes for Company */}
                <Route element={<CompanyLayout><Outlet /></CompanyLayout>}>
                    <Route path="/company" element={<ProtectedRoute allowedRoles={['company']}><CompanyDashboard /></ProtectedRoute>} />
                    <Route path="/company/post-job" element={<ProtectedRoute allowedRoles={['company']}><PostJob /></ProtectedRoute>} />
                    <Route path="/company/manage-jobs" element={<ProtectedRoute allowedRoles={['company']}><ManageJobs /></ProtectedRoute>} />
                    <Route path="/company/view-applicants/:jobId" element={<ProtectedRoute allowedRoles={['company']}><ViewApplicants /></ProtectedRoute>} />
                    <Route path="/company/pipeline/:jobId" element={<ProtectedRoute allowedRoles={['company']}><HiringPipeline /></ProtectedRoute>} />
                    <Route path="/company/applicants" element={<ProtectedRoute allowedRoles={['company']}><ManageApplications /></ProtectedRoute>} />
                    <Route path="/company/assessments" element={<ProtectedRoute allowedRoles={['company']}><AssessmentsDashboard /></ProtectedRoute>} />
                    <Route path="/company/assessments/create" element={<ProtectedRoute allowedRoles={['company']}><CreateAssessment /></ProtectedRoute>} />
                    <Route path="/company/assessments/:id/results" element={<ProtectedRoute allowedRoles={['company']}><AssessmentResults /></ProtectedRoute>} />
                    <Route path="/company/interviews" element={<ProtectedRoute allowedRoles={['company']}><InterviewScheduler /></ProtectedRoute>} />
                    <Route path="/company/messages" element={<ProtectedRoute allowedRoles={['company']}><CompanyMessages /></ProtectedRoute>} />
                    <Route path="/company/analytics" element={<ProtectedRoute allowedRoles={['company']}><CompanyAnalytics /></ProtectedRoute>} />
                    <Route path="/company/profile" element={<ProtectedRoute allowedRoles={['company']}><CompanyProfile /></ProtectedRoute>} />
                    <Route path="/company/settings" element={<ProtectedRoute allowedRoles={['company']}><CompanySettings /></ProtectedRoute>} />
                    
                    <Route path="/company/candidate-matches" element={<ProtectedRoute allowedRoles={['company']}><CandidateMatches /></ProtectedRoute>} />
                    <Route path="/company/subscriptions" element={<ProtectedRoute allowedRoles={['company']}><SubscriptionPlans /></ProtectedRoute>} />
                    <Route path="/company/payment-success" element={<ProtectedRoute allowedRoles={['company']}><PaymentSuccess /></ProtectedRoute>} />
                    <Route path="/company/payment-failed" element={<ProtectedRoute allowedRoles={['company']}><PaymentFailed /></ProtectedRoute>} />
                    <Route path="/company/payment-history" element={<ProtectedRoute allowedRoles={['company']}><PaymentHistory /></ProtectedRoute>} />
                </Route>

                {/* Catch all */}
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </ToastProvider>
    );
}

export default App;
