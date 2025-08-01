// No React import needed with modern JSX transform
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';

// Pages
import Login from 'routes/Login';
import Signup from 'routes/Signup';
import Dashboard from 'routes/Dashboard';

// Components
import PublicRegistry from 'src/app/routes/guest/PublicRegistry';

// Components
import ProtectedRoute from 'components/ProtectedRoute';

// Auth service
import { userService } from 'services/user.service';
import BuyGifts from 'src/app/routes/guest/BuyGifts';
import antdThemeConfig from 'styles/config/antdThemeConfig';
import { useEffect } from 'react';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { HomePage } from 'routes/HomePage';
import { TopNav } from 'src/app/modules/navigation/topnav/TopNav';
import { V2ManageRegistry } from 'routes/couple/v2ManageRegistry';

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
          {/* Public routes */}
          <Route
            path="/"
            element={
              <>
                <TopNav />
                <HomePage />
              </>
            }
          />
          <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <Login />} />
          <Route path="/registrar" element={isAuthenticated ? <Navigate to="/" /> : <Signup />} />

          {/* Public registry view for guests */}
          <Route path="/:coupleSlug" element={<PublicRegistry />}>
            <Route index element={<HomePage />} />
            <Route path="regalos" element={<BuyGifts />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<Dashboard />}>
                <Route path="gestionar" element={<V2ManageRegistry />} />
              </Route>
            </Route>
          </Route>

          {/* Protected routes for couple */}
          {/* <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Dashboard />}>
              <Route index element={<HomePage />} />
              <Route path="gestionar" element={<ManageRegistry />} />
              <Route path="compras-realizadas" element={<PurchasedGifts />} />
              <Route path="mis-compras" element={<MyPurchases />} />
              <Route path="messages" element={<div className="m-6 p-6 bg-white rounded-lg shadow">Mensajes (En desarrollo)</div>} />
              <Route path="profile" element={<div className="m-6 p-6 bg-white rounded-lg shadow">Mi Perfil (En desarrollo)</div>} />
              <Route path="settings" element={<div className="m-6 p-6 bg-white rounded-lg shadow">Configuración (En desarrollo)</div>} />
            </Route>
          </Route> */}

          {/* Protected routes for guest */}
          <Route element={<ProtectedRoute />}>
            <Route path="/guest" element={<PublicRegistry />}>
              <Route path="regalos" element={<BuyGifts />} />
            </Route>
          </Route>

          {/* Redirect to login or dashboard based on auth status */}
          <Route path="*" element={<Navigate to={isAuthenticated ? '/:coupleSlug' : '/'} />} />
        </Routes>
      </BrowserRouter>
      {isLocalhost && <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />}
    </ConfigProvider>
  );
}

export default App;
