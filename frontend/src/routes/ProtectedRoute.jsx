import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Loading from '../components/Loading';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, token, loading } = useContext(AuthContext);

  if (loading) {
    return <Loading text="Authenticating session..." />;
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role?.toUpperCase())) {
    // Redirect to user's assigned dashboard if trying to access unauthorized route
    const roleDashboards = {
      ADMIN: '/admin/dashboard',
      DONOR: '/donor/dashboard',
      NGO: '/ngo/dashboard',
      VOLUNTEER: '/volunteer/dashboard',
    };
    return <Navigate to={roleDashboards[user.role?.toUpperCase()] || '/login'} replace />;
  }

  return children;
};

export default ProtectedRoute;
