import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const GuestRoute = ({ children }) => {
  const { isAuthenticated, user, isLoading } = useSelector((state) => state.auth);

  // if (isLoading) {
  //   return <div>Loading...</div>;
  // }

  if (isAuthenticated && user) {
    return <Navigate to="/home" replace />;
  }

  return children;
};

export default GuestRoute;