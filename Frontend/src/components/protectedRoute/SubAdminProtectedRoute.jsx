import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

const SubAdminProtectedRoute = ({ children }) => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const location = useLocation();

  if (!isAuthenticated || !user ) {
    return <Navigate to="/sub-admin-login" state={{ from: location }} replace />;
  }

  if (!user.is_subadmin) {
    if (user.is_superadmin) {
      return <Navigate to="/admin-dashboard" replace />;
    } else {
      return <Navigate to="/home" replace />;
    }
  }

  return children;
};

export default SubAdminProtectedRoute;