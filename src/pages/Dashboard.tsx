import React, { useEffect, useState } from 'react';
import { Layout, Menu, Button, message, Typography } from 'antd';
import { HomeOutlined, UserOutlined, GiftOutlined, ShoppingOutlined, SettingOutlined, LogoutOutlined, HeartOutlined, GiftFilled } from '@ant-design/icons';
import { useNavigate, Link, Outlet } from 'react-router-dom';
import { userService } from '../api/userService';
import type { DashboardUserData } from '../api/userService';
import { useQuery } from '@tanstack/react-query';

// No need to import child components as they're now handled by App.tsx

const { Header, Content, Footer, Sider } = Layout;
const { Title } = Typography;

const Dashboard: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [currentPath, setCurrentPath] = useState<string>('/dsahboard');
  const navigate = useNavigate();

  // track the current path from url to update the menu
  useEffect(() => {
    console.log('currentPath', window.location.pathname);
    setCurrentPath(window.location.pathname);
  }, []);

  // Use React Query to fetch the current user's data
  const { data: userData, isLoading, error } = useQuery<DashboardUserData>({
    queryKey: ['currentUser'],
    queryFn: () => userService.getCurrentUser(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
  
  // Determine if the user is a couple
  const isCouple = userData?.role === 'COUPLE';
  
  useEffect(() => {
    // Check if user is authenticated
    if (!userService.isAuthenticated()) {
      navigate('/login');
      return;
    }
  }, [navigate]);
  
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
      <Sider 
        collapsible 
        collapsed={collapsed} 
        onCollapse={setCollapsed}
        className=""
        width={210}
      >
        <div className="p-4 h-8 m-4 flex items-center justify-center bg-pistaccio rounded">
          {collapsed ? <>
          <GiftFilled className="!text-white !font-bold !text-xl mr-2" />
          <span className="text-white font-bold text-xl">RA</span>
          </> : <>
          <GiftFilled className="!text-white !font-bold !text-xl mr-2" />
          <span className="text-white font-bold text-xl">RegalAmor</span>
          </>}
        </div>
        <Menu 
          theme="light" 
          selectedKeys={[currentPath]} 
          mode="inline" 
          className="!text-white"
          onClick={({ key }) => setCurrentPath(key)}
          items={[
            {
              key: '/dashboard',
              icon: <HomeOutlined />,
              label: <Link to="/dashboard">Inicio</Link>
            },
            ...(isCouple ? [
              {
                key: '/dashboard/gift-registry',
                icon: <GiftOutlined />,
                label: <Link to="/dashboard/gift-registry">Mesa de Regalos</Link>
              },
              {
                key: '/dashboard/purchased-gifts',
                icon: <ShoppingOutlined />,
                label: <Link to="/dashboard/purchased-gifts">Regalos Comprados</Link>
              },
              {
                key: '/dashboard/messages',
                icon: <HeartOutlined />,
                label: <Link to="/dashboard/messages">Mensajes</Link>
              }
            ] : [
              {
                key: '/dashboard/gift-lists',
                icon: <GiftOutlined />,
                label: <Link to="/dashboard/gift-lists">Ver Listas de Regalos</Link>
              },
              {
                key: '/dashboard/my-purchases',
                icon: <ShoppingOutlined />,
                label: <Link to="/dashboard/my-purchases">Mis Compras</Link>
              }
            ]),
            {
              key: '/dashboard/profile',
              icon: <UserOutlined />,
              label: <Link to="/dashboard/profile">Mi Perfil</Link>
            },
            {
              key: '/dashboard/settings',
              icon: <SettingOutlined />,
              label: <Link to="/dashboard/settings">Configuración</Link>
            }
          ]}
        >
        </Menu>
      </Sider>
      <Layout>
        <Header className="bg-white p-0 shadow">
          <div className="flex justify-between items-center pl-6 h-full">
            <Title level={4} className="!m-0 !text-white">Panel de Control</Title>
            <div>
              <Button 
                type="default" 
                icon={<LogoutOutlined />}
                onClick={handleLogout}
                >
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </Header>
        <Content>
          {/* Child routes will be rendered here */}
          <Outlet context={{ userData, isLoading, isCouple }} />
        </Content>
        <Footer className="text-center">
          RegalAmor {new Date().getFullYear()} - Tu plataforma para listas de regalos de boda
        </Footer>
      </Layout>
    </Layout>
  );
};

export default Dashboard;
