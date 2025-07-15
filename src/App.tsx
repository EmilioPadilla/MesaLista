// No React import needed with modern JSX transform
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';

// Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';

// Components
import DashboardContent from './components/DashboardContent';
import GiftRegistry from './components/GiftRegistry';
import PurchasedGifts from './components/PurchasedGifts';

// Components
import ProtectedRoute from './components/ProtectedRoute';

// Auth service
import { userService } from './api/userService';
import GiftLists from './components/GiftLists';
import MyPurchases from './components/MyPurchases';
import antdThemeConfig from './styles/config/antdThemeConfig';

function App() {
  // Check if user is already authenticated
  const isAuthenticated = userService.isAuthenticated();

  return (
    <ConfigProvider
      theme={antdThemeConfig}
    >
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} />
          <Route path="/signup" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Signup />} />
          
          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />}>
              <Route index element={<DashboardContent userData={undefined} isLoading={false} isCouple={false} />} />
              <Route path="gift-registry" element={<GiftRegistry />} />
              <Route path="purchased-gifts" element={<PurchasedGifts />} />
              <Route path="messages" element={<div className="m-6 p-6 bg-white rounded-lg shadow">Mensajes (En desarrollo)</div>} />
              <Route path="gift-lists" element={<GiftLists />} />
              <Route path="my-purchases" element={<MyPurchases />} />
              <Route path="profile" element={<div className="m-6 p-6 bg-white rounded-lg shadow">Mi Perfil (En desarrollo)</div>} />
              <Route path="settings" element={<div className="m-6 p-6 bg-white rounded-lg shadow">Configuración (En desarrollo)</div>} />
            </Route>
            {/* Add more protected routes here */}
          </Route>
          
          {/* Redirect to login or dashboard based on auth status */}
          <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;
