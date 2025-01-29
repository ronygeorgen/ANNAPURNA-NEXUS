import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

const ProtectedRoute = ({ children, allowAdmin = true, allowSubAdmin = true }) => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const location = useLocation();

  if (!isAuthenticated || !user ) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user.is_superadmin && !allowAdmin) {
    return <Navigate to="/admin-dashboard" replace />;
  }

  if (user.is_subadmin && !allowSubAdmin) {
    return <Navigate to="/sub-admin-dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;