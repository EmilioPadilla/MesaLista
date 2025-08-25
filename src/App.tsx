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
import antdThemeConfig from 'styles/config/antdThemeConfig';
import { useEffect } from 'react';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { HomePage } from 'routes/HomePage';
import { TopNav } from 'src/app/modules/navigation/topnav/TopNav';
import { BuyGifts } from 'src/app/routes/guest/BuyGifts';
import { Checkout } from 'routes/checkout/Checkout';
import { OrderConfirmation } from 'routes/checkout/OrderConfirmation';
import { ManageRegistry } from 'src/app/routes/couple/ManageRegistry';

function App() {
  // Check if user is already authenticated every time the path changes
  let isAuthenticated = userService.isAuthenticated();
  const path = window.location.pathname;
  const isLocalhost = window.location.hostname === 'localhost';
  const coupleSlug = window.location.pathname.split('/')[1];

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
          <Route path="/login" element={isAuthenticated ? <Navigate to={`/${coupleSlug}`} /> : <Login />} />
          {/* <Route path="/registro" element={isAuthenticated ? <Navigate to={`/${coupleSlug}`} /> : <Signup />} /> */}

          {/* Public registry view for guests */}
          <Route path="/:coupleSlug" element={<PublicRegistry />}>
            <Route index element={<HomePage />} />
            <Route path="regalos" element={<BuyGifts />} />
            <Route path="checkout" element={<Checkout />} />
            <Route path="confirmation" element={<OrderConfirmation />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<Dashboard />}>
                <Route path="gestionar" element={<ManageRegistry />} />
              </Route>
            </Route>
          </Route>

          {/* Protected routes for guest */}
          <Route element={<ProtectedRoute />}>
            <Route path="/guest" element={<PublicRegistry />} />
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
