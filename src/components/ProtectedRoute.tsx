import React, { useState, useEffect } from 'react';
import { Navigate, Outlet, useOutletContext } from 'react-router-dom';
import { userService } from '../services/user.service';
import { OutletContextType } from 'routes/guest/PublicRegistry';
import { Spin } from 'antd';

interface ProtectedRouteProps {
  redirectPath?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ redirectPath = '/login' }) => {
  const contextData = useOutletContext<OutletContextType>();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Check authentication status once when component mounts
    const checkAuth = () => {
      try {
        const authStatus = userService.isAuthenticated();
        setIsAuthenticated(authStatus);
      } catch (error) {
        console.error('Error checking authentication:', error);
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  // Show loading state while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectPath} replace />;
  }

  return <Outlet context={contextData} />;
};

export default ProtectedRoute;
