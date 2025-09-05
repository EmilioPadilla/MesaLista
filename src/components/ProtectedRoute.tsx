import React from 'react';
import { Navigate, Outlet, useOutletContext } from 'react-router-dom';
import { OutletContextType } from 'routes/guest/PublicRegistry';
import { Spin } from 'antd';
import { useIsAuthenticated } from 'hooks/useUser';

interface ProtectedRouteProps {
  redirectPath?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ redirectPath = '/login' }) => {
  const contextData = useOutletContext<OutletContextType>();
  const { data: isAuthenticated = false, isLoading } = useIsAuthenticated();

  // Show loading state while checking authentication
  if (isLoading) {
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
