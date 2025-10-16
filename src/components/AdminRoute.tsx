import React from 'react';
import { Navigate, Outlet, useOutletContext } from 'react-router-dom';
import { OutletContextType } from 'routes/guest/PublicRegistry';
import { Spin } from 'antd';
import { useIsAuthenticated, useCurrentUser } from 'hooks/useUser';

interface AdminRouteProps {
  redirectPath?: string;
}

/**
 * Protected route that requires admin role
 * Redirects to login if not authenticated
 * Redirects to home if authenticated but not admin
 */
const AdminRoute: React.FC<AdminRouteProps> = ({ redirectPath = '/' }) => {
  const contextData = useOutletContext<OutletContextType>();
  const { data: isAuthenticated = false, isLoading: isAuthLoading } = useIsAuthenticated();
  const { data: currentUser, isLoading: isUserLoading } = useCurrentUser();

  // Show loading state while checking authentication and user data
  if (isAuthLoading || isUserLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Redirect to home if not admin
  if (currentUser?.role !== 'ADMIN') {
    return <Navigate to={redirectPath} replace />;
  }

  return <Outlet context={contextData} />;
};

export default AdminRoute;
