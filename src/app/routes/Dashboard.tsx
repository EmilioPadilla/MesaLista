import React, { useEffect, useState } from 'react';
import { Layout, message } from 'antd';
import { useNavigate, Outlet } from 'react-router-dom';
import { userService } from '../../services/user.service';
import { SideDrawer } from '../modules/navigation/sidenav/SideDrawer';
import { HeaderComponent } from '../modules/navigation/Header';
import { useCurrentUser } from 'hooks/useUser';

const { Content, Footer } = Layout;

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // track the current path from url to update the menu
  useEffect(() => {
    setCurrentPath(window.location.pathname);
  }, [window.location.pathname]);

  // Use React Query to fetch the current user's data
  const { data: userData, isLoading, error } = useCurrentUser();

  // Determine if the user is a couple
  const isCouple = userData?.role === 'COUPLE';

  // Show error message if the query fails
  useEffect(() => {
    if (error) {
      console.error('Error fetching dashboard data:', error);
      message.error('Error al cargar los datos del panel');
    }
  }, [error]);

  const handleLogout = () => {
    userService.logout();
    message.success('Has cerrado sesión exitosamente');
    navigate('/login');
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout>
        <HeaderComponent currentPath={currentPath} setCurrentPath={setCurrentPath} drawerOpen={drawerOpen} setDrawerOpen={setDrawerOpen} />
        <Content>
          {/* Child routes will be rendered here */}
          <Outlet context={{ userData, isLoading, isCouple }} />
        </Content>
        <Footer className="text-center">MesaLista {new Date().getFullYear()} - Tu plataforma para listas de regalos de boda</Footer>
      </Layout>
      <SideDrawer
        drawerOpen={drawerOpen}
        setDrawerOpen={setDrawerOpen}
        currentPath={currentPath}
        setCurrentPath={setCurrentPath}
        isCouple={isCouple}
        handleLogout={handleLogout}
      />
    </Layout>
  );
};

export default Dashboard;
