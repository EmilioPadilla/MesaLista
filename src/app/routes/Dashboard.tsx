import React, { useEffect } from 'react';
import { Layout, message } from 'antd';
import { useNavigate, Outlet, useOutletContext } from 'react-router-dom';
import { useCurrentUser } from 'hooks/useUser';
import { OutletContextType } from 'routes/guest/PublicRegistry';
import { User } from 'types/models/user';

const { Content } = Layout;

export interface OutletContextPrivateType extends OutletContextType {
  userData?: User;
  publicData?: OutletContextType;
}

const Dashboard: React.FC = () => {
  const contextData = useOutletContext<OutletContextType>();
  const navigate = useNavigate();

  // Use React Query to fetch the current user's data
  const { data: userData, error } = useCurrentUser();

  // Show error message if the query fails
  useEffect(() => {
    if (error) {
      console.error('Error fetching dashboard data:', error);
      message.error('Error al cargar los datos del panel');
      navigate('/login');
    }
  }, [error]);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout>
        <Content>
          {/* Child routes will be rendered here */}
          <Outlet context={{ publicData: contextData, userData }} />
        </Content>
      </Layout>
    </Layout>
  );
};

export default Dashboard;
