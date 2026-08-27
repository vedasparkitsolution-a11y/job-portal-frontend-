import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

export default function ProtectedRoute({ children, allowedRoles }) {
    const { currentUser, userRole, loading } = useAuth();

    if (loading) {
        return <LoadingSpinner />;
    }

    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && allowedRoles.length > 0) {
        const normalizedUserRole = userRole === 'candidate' ? 'jobseeker' : userRole === 'employer' ? 'company' : userRole;
        const normalizedAllowedRoles = allowedRoles.flatMap(r => {
            if (r === 'jobseeker' || r === 'candidate') return ['jobseeker', 'candidate'];
            if (r === 'company' || r === 'employer') return ['company', 'employer'];
            return [r];
        });

        const isAllowed = normalizedAllowedRoles.includes(userRole) || normalizedAllowedRoles.includes(normalizedUserRole);
        if (!isAllowed) {
            return <Navigate to="/" replace />;
        }
    }

    return children;
}
