import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// No React import needed with modern JSX transform
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
// Pages
import Login from 'routes/Login';
import Signup from 'routes/Signup';
import Dashboard from 'routes/Dashboard';
// Components
import ManageRegistry from 'routes/ManageRegistry';
import GiftRegistry from 'routes/GiftRegistry';
import PurchasedGifts from 'routes/PurchasedGifts';
// Components
import ProtectedRoute from 'components/ProtectedRoute';
// Auth service
import { userService } from 'services/user.service';
import GiftLists from 'src/components/GiftList';
import MyPurchases from 'components/MyPurchases';
import antdThemeConfig from 'styles/config/antdThemeConfig';
function App() {
    // Check if user is already authenticated
    const isAuthenticated = userService.isAuthenticated();
    console.log('isAuthenticated', isAuthenticated);
    return (_jsx(ConfigProvider, { theme: antdThemeConfig, children: _jsx(BrowserRouter, { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/login", element: isAuthenticated ? _jsx(Navigate, { to: "/dashboard" }) : _jsx(Login, {}) }), _jsx(Route, { path: "/signup", element: isAuthenticated ? _jsx(Navigate, { to: "/dashboard" }) : _jsx(Signup, {}) }), _jsx(Route, { element: _jsx(ProtectedRoute, {}), children: _jsxs(Route, { path: "/dashboard", element: _jsx(Dashboard, {}), children: [_jsx(Route, { path: "", element: _jsx(ManageRegistry, {}) }), _jsx(Route, { path: "gift-registry", element: _jsx(GiftRegistry, {}) }), _jsx(Route, { path: "purchased-gifts", element: _jsx(PurchasedGifts, {}) }), _jsx(Route, { path: "messages", element: _jsx("div", { className: "m-6 p-6 bg-white rounded-lg shadow", children: "Mensajes (En desarrollo)" }) }), _jsx(Route, { path: "gift-lists", element: _jsx(GiftLists, {}) }), _jsx(Route, { path: "my-purchases", element: _jsx(MyPurchases, {}) }), _jsx(Route, { path: "profile", element: _jsx("div", { className: "m-6 p-6 bg-white rounded-lg shadow", children: "Mi Perfil (En desarrollo)" }) }), _jsx(Route, { path: "settings", element: _jsx("div", { className: "m-6 p-6 bg-white rounded-lg shadow", children: "Configuraci\u00F3n (En desarrollo)" }) })] }) }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: isAuthenticated ? '/dashboard' : '/login' }) })] }) }) }));
}
export default App;
