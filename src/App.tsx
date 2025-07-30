// No React import needed with modern JSX transform
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';

// Pages
import Login from 'routes/Login';
import Signup from 'routes/Signup';
import Dashboard from 'routes/Dashboard';

// Components
import ManageRegistry from 'src/app/routes/couple/ManageRegistry';
import PurchasedGifts from 'src/app/routes/guest/PurchasedGifts';
import PublicRegistry from 'src/app/routes/guest/PublicRegistry';

// Components
import ProtectedRoute from 'components/ProtectedRoute';

// Auth service
import { userService } from 'services/user.service';
import BuyGifts from 'src/app/routes/guest/BuyGifts';
import MyPurchases from 'components/MyPurchases';
import antdThemeConfig from 'styles/config/antdThemeConfig';
import { useEffect } from 'react';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

function App() {
  // Check if user is already authenticated every time the path changes
  let isAuthenticated = userService.isAuthenticated();
  const path = window.location.pathname;
  const isLocalhost = window.location.hostname === 'localhost';

  useEffect(() => {
    isAuthenticated = userService.isAuthenticated();
  }, [path]);

  return (
    <ConfigProvider theme={antdThemeConfig}>
      <BrowserRouter>
        <Routes>
          {/* Public registry view for guests */}
          <Route path="/:coupleSlug" element={<PublicRegistry />}>
            <Route path="regalos" element={<BuyGifts />} />
          </Route>
          {/* Public routes */}
          <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} />
          <Route path="/registrar" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Signup />} />

          {/* Protected routes for couple */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />}>
              <Route index element={<ManageRegistry />} />
              <Route path="compras-realizadas" element={<PurchasedGifts />} />
              <Route path="mis-compras" element={<MyPurchases />} />
              <Route path="messages" element={<div className="m-6 p-6 bg-white rounded-lg shadow">Mensajes (En desarrollo)</div>} />
              <Route path="profile" element={<div className="m-6 p-6 bg-white rounded-lg shadow">Mi Perfil (En desarrollo)</div>} />
              <Route path="settings" element={<div className="m-6 p-6 bg-white rounded-lg shadow">Configuración (En desarrollo)</div>} />
            </Route>
          </Route>

          {/* Protected routes for guest */}
          <Route element={<ProtectedRoute />}></Route>

          {/* Redirect to login or dashboard based on auth status */}
          <Route path="*" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} />} />
        </Routes>
      </BrowserRouter>
      {isLocalhost && <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />}
    </ConfigProvider>
  );
}

export default App;
