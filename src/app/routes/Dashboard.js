import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Layout, message } from 'antd';
import { useNavigate, Outlet } from 'react-router-dom';
import { userService } from '../../services/user.service';
import { SideDrawer } from '../modules/navigation/sidenav/SideDrawer';
import { HeaderComponent } from '../modules/navigation/Header';
import { useCurrentUser } from 'hooks/useUser';
const { Content, Footer } = Layout;
const Dashboard = () => {
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
    return (_jsxs(Layout, { style: { minHeight: '100vh' }, children: [_jsxs(Layout, { children: [_jsx(HeaderComponent, { currentPath: currentPath, setCurrentPath: setCurrentPath, drawerOpen: drawerOpen, setDrawerOpen: setDrawerOpen }), _jsx(Content, { children: _jsx(Outlet, { context: { userData, isLoading, isCouple } }) }), _jsxs(Footer, { className: "text-center", children: ["MesaLista ", new Date().getFullYear(), " - Tu plataforma para listas de regalos de boda"] })] }), _jsx(SideDrawer, { drawerOpen: drawerOpen, setDrawerOpen: setDrawerOpen, currentPath: currentPath, setCurrentPath: setCurrentPath, isCouple: isCouple, handleLogout: handleLogout })] }));
};
export default Dashboard;
