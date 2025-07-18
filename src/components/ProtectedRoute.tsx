import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { userService } from '../services/user.service';

interface ProtectedRouteProps {
  redirectPath?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ redirectPath = '/login' }) => {
  const isAuthenticated = userService.isAuthenticated();

  if (!isAuthenticated) {
    return <Navigate to={redirectPath} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
